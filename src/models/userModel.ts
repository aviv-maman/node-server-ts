const crypto = require('crypto');
import { model, Schema } from 'mongoose';
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please enter your first name!'],
    },
    lastName: {
      type: String,
      required: [true, 'Please enter your last name!'],
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    dateOfBirth: {
      type: Date,
      // required: [true, 'Please enter your date of birth!'],
    },
    phoneNumber: {
      type: String,
      // required: [true, 'Please enter your phone number!'],
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!! So on updating a user, we need to use Save as well and not findOneAndUpdate
        validator: function (element) {
          return element === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    // passwordChangedAt: Date,
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    // passwordResetToken: String,
    passwordResetToken: {
      type: String,
      select: false,
    },
    // passwordResetExpires: Date,
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    __v: {
      type: Number,
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    newEmailToken: {
      type: String,
      select: false,
    },
    newEmailExpires: {
      type: Date,
      select: false,
    },
    candidateEmail: {
      type: String,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      select: false,
    },
    googleId: {
      type: String,
      // select: false,
    },
  },
  {
    timestamps: true, // add updatedAt
  }
);

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //Subtract 1 second to make sure the token is created before the password was changed
  next();
});

userSchema.pre(/^find/, function (next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  console.log({ verificationToken }, this.emailVerificationToken);

  this.emailVerificationExpires = Date.now() + 60 * 60 * 1000; // 60 minutes

  return verificationToken;
};

userSchema.methods.createNewEmailToken = function () {
  const NewEmailToken = crypto.randomBytes(32).toString('hex');

  this.newEmailToken = crypto
    .createHash('sha256')
    .update(NewEmailToken)
    .digest('hex');

  console.log({ NewEmailToken }, this.newEmailToken);

  this.newEmailExpires = Date.now() + 60 * 60 * 1000; // 60 minutes

  return NewEmailToken;
};

const User = model('User', userSchema);

module.exports = User;
