import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
// import { promisify } from 'util';
import { sign as jwtSign, verify as jwtVerify } from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/userModel';
import type { User } from '../models/userModel';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { sendEmail } from '../utils/email';
import type { HydratedDocument } from 'mongoose';
import { omit } from 'lodash';

const signToken = (id: string) =>
  jwtSign({ id }, process.env.JWT_SECRET ?? '', {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (
  user: HydratedDocument<User>,
  statusCode: number,
  res: Response
) => {
  const token = signToken(user._id as unknown as string);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.JWT_COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: false,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from output
  const userWithoutPassword = omit(user, user.password);

  res.status(statusCode).json({
    success: true,
    token,
    user: userWithoutPassword,
  });
};

const verifyToken = async (
  token: string,
  secret: string
): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwtVerify(token, secret, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as JwtPayload);
    });
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const newUser = await UserModel.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await UserModel.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

export const logout = (req: Request, res: Response) => {
  // res.cookie('jwt', 'logged_out', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true,
  // });
  res.clearCookie('jwt');
  res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verification token
  const decoded = await verifyToken(token, process.env.JWT_SECRET ?? '');

  // 3) Check if user still exists
  const currentUser = await UserModel.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }

  // 4) Check if user changed password after the token was issued [iat = issued at]
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for rendered pages, no errors!
export const isLoggedIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.cookies.jwt) {
    try {
      // 1) verify token
      const decoded = await verifyToken(
        req.cookies.jwt,
        process.env.JWT_SECRET ?? ''
      );

      // 2) Check if user still exists
      const currentUser = await UserModel.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

export const restrictTo =
  (...roles: User['role'][]) =>
  (req: Request, res: Response, next: NextFunction) => {
    // roles ['admin', 'lead-guide']. role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };

export const forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('Email address was not specified.', 400));
  }

  //When updating password or user, we always use save method, not update method
  // 1) Get user based on POSTed email
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        `There is no user with that email address (${req.body.email})`,
        404
      )
    );
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // turn off validation because we don't want to validate the passwordConfirm field

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      text: message,
    });

    res.status(200).json({
      success: true,
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save(); // Upon updating user or user's password we need to use save and not update in order to run validators

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await UserModel.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (user) {
    if (
      !(await user.correctPassword(req.body.currentPassword, user.password))
    ) {
      return next(new AppError('Your current password is wrong.', 401));
    }

    // 3) If so, update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.newPasswordConfirm; // passwordConfirm will be validated by the validator in the user model (userSchema) and deleted from the document
    await user.save();
    // User.findByIdAndUpdate will NOT work as intended! Don't use anything related to update on passwords!

    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  }
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  // const { token } = req.params;
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    // const {
    //   user: { id },
    // } = jwt.verify(token, process.env.JWT_SECRET);
    // mark the email address as verified in the database
    // const user = await User.findByIdAndUpdate(id, { isEmailVerified: true });
    // const user = await User.findById(id);

    const user = await UserModel.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, verify the email
    if (!user) {
      return next(new AppError('User was not found or token is invalid', 400));
    }
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    // return res.status(400).json({ message: 'Invalid token' });
    return next(new AppError('Invalid token or token has expired', 400));
  }
});

export const sendVerificationEmail = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(new AppError('Email address was not specified.', 400));
  }

  //When updating password or user, we always use save method, not update method
  // 1) Get user based on POSTed email
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        `There is no user with that email address (${req.body.email})`,
        404
      )
    );
  }

  if (user.isEmailVerified) {
    return next(new AppError('Email address is already verified', 400));
  }

  // 2) Generate the random verification token
  const verificationToken = user.createEmailVerificationToken();
  await user.save({ validateBeforeSave: false }); // turn off validation because we don't want to validate the passwordConfirm field

  // 3) Send it to user's email
  const verificationURL = `${req.get(
    'origin'
  )}/profile/verify-email/${verificationToken}`;

  const message = `Click on the link to verify your email address: ${verificationURL}.\nIf you didn't ask to verify, please ignore this email!`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify Your Email (Valid for 60 Minutes)',
      text: message,
    });

    res.status(200).json({
      success: true,
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the verification email. Try again later!',
        500
      )
    );
  }
});

export const sendNewAddressEmail = catchAsync(async (req, res, next) => {
  if (!req.body.currentEmail || !req.body.newEmail) {
    return next(
      new AppError(
        'Current email address or new email address were not specified.',
        400
      )
    );
  }

  if (req.body.currentEmail === req.body.newEmail) {
    return next(
      new AppError(
        'Current email address and the new email address are the same.',
        400
      )
    );
  }

  if (!req.body.password) {
    return next(new AppError('Password was not provided.', 400));
  }

  //When updating password or user, we always use save method, not update method
  // 1) Get user based on POSTed email
  const isEmailAlreadyUsed = await UserModel.findOne({
    email: req.body.newEmail,
  });
  if (isEmailAlreadyUsed) {
    return next(
      new AppError(`Email address is already used (${req.body.newEmail})`, 404)
    );
  }

  // 1) Get user based on POSTed email and check if it is verified and if password is correct
  const user = await UserModel.findOne({ email: req.body.currentEmail }).select(
    '+password'
  );

  if (
    !user ||
    !(await user.correctPassword(req.body.password, user.password))
  ) {
    return next(new AppError('Incorrect email or password', 401));
  }

  if (!user.isEmailVerified) {
    return next(
      new AppError(
        'Verify your current email address before changing it to other one',
        400
      )
    );
  }

  // 2) Generate the random token
  const newEmailToken = user.createNewEmailToken();
  user.candidateEmail = req.body.newEmail;
  await user.save({ validateBeforeSave: false }); // turn off validation because we don't want to validate the passwordConfirm field

  // 3) Send it to user's email
  const emailURL = `${req.get('origin')}/profile/new-email/${newEmailToken}`;

  const message = `Click on the link to verify your email address: ${emailURL}.\nIf you didn't ask to change your email, please ignore this email!`;

  try {
    await sendEmail({
      to: user.candidateEmail,
      subject: 'Verify Your New Email (Valid for 60 Minutes)',
      text: message,
    });

    res.status(200).json({
      success: true,
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.newEmailToken = undefined;
    user.newEmailExpires = undefined;
    user.candidateEmail = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the verification of new email. Try again later!',
        500
      )
    );
  }
});

export const changeEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  try {
    const user = await UserModel.findOne({
      newEmailToken: hashedToken,
      newEmailExpires: { $gt: Date.now() },
    }).select('+candidateEmail');

    // 2) If token has not expired, verify the email
    if (!user) {
      return next(new AppError('User was not found or token is invalid', 400));
    }
    if (user.candidateEmail) user.email = user.candidateEmail;
    user.candidateEmail = undefined;
    user.newEmailToken = undefined;
    user.newEmailExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .json({ success: true, message: 'Email was changed successfully' });
  } catch (error) {
    return next(new AppError('Invalid token or token has expired', 400));
  }
});

export const googleLogin = catchAsync(async (req, res, next) => {
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: req.body.idToken,
      audience: process.env.GOOGLE_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userId = payload?.sub;
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
    try {
      let user = await UserModel.findOne({ googleId: userId });
      if (user) {
        createSendToken(user, 200, res);
      } else {
        const isEmailAlreadyRegistered = await UserModel.findOne({
          email: payload?.email,
        });
        if (isEmailAlreadyRegistered) {
          isEmailAlreadyRegistered.googleId = userId;
          isEmailAlreadyRegistered.save({ validateBeforeSave: false });
          user = isEmailAlreadyRegistered;
        } else {
          const newUser = await new UserModel({
            email: payload?.email,
            googleId: userId,
            firstName: payload?.given_name,
            lastName: payload?.family_name,
            photo: payload?.picture,
            locale: payload?.locale,
          }).save({ validateBeforeSave: false });
          user = newUser;
        }
        createSendToken(user, 200, res);
      }
    } catch (error) {
      return next(new AppError('Incorrect token', 401));
    }
  }
  verify().catch(console.error);
});
