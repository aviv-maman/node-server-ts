import { Router } from 'express';
import userController from '../controllers/userController';
import authController from '../controllers/authController';

export const userRouter = Router();

userRouter.post('/signup', authController.signup);
userRouter.post('/login', authController.login);
userRouter.get('/logout', authController.logout);

userRouter.post('/auth-google', authController.googleLogin);
// userRouter.post('/auth/facebook', authController.facebookLogin);

userRouter.post('/forgotPassword', authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);

userRouter.post(
  '/send-verification-email',
  authController.sendVerificationEmail
);
userRouter.patch('/verify-email/:token', authController.verifyEmail);

userRouter.post('/send-new-email', authController.sendNewAddressEmail);
userRouter.patch('/new-email/:token', authController.changeEmail);

// Protect all routes after this middleware
userRouter.use(authController.protect);

userRouter.patch('/updateMyPassword', authController.updatePassword);
userRouter.get('/me', userController.getMe, userController.getUser);
userRouter.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
userRouter.delete('/deleteMe', userController.deleteMe);

userRouter.use(authController.restrictTo('admin'));

userRouter
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

userRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
