const router = require("express").Router();

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate");
const { registerSchema } = require("../validators/auth.validator");
const { forgotPasswordSchema, resetPasswordSchema } = require("../validators/password.validator");

/**
 * REGISTER (with validation)
 */
router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

/**
 * LOGIN
 */
router.post(
  "/login",
  authController.login
);

/**
 * SEND OTP
 */
router.post(
  "/send-otp",
  authController.sendOtp
);

/**
 * VERIFY OTP
 */
router.post(
  "/verify-otp",
  authController.verifyOtp
);

/**
 * GET PROFILE (Protected)
 */
router.get(
  "/me",
  authMiddleware,
  authController.profile
);

/**
 * FORGOT PASSWORD
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * RESET PASSWORD
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);

module.exports = router;
