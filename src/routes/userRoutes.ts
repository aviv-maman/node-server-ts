import { Router } from 'express';
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/auth-google', authController.googleLogin);
// router.post('/auth/facebook', authController.facebookLogin);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.post('/send-verification-email', authController.sendVerificationEmail);
router.patch('/verify-email/:token', authController.verifyEmail);

router.post('/send-new-email', authController.sendNewAddressEmail);
router.patch('/new-email/:token', authController.changeEmail);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
