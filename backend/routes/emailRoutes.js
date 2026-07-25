const express = require('express');
const router = express.Router();
const { sendVerificationEmail, verifyEmailCode } = require('../controllers/emailController');

router.route('/email').post(sendVerificationEmail);
router.route('/verify').post(verifyEmailCode);
module.exports = router;