const asyncHandler = require('express-async-handler');
const connectToEmailService = require('../config/transporter');
const emailValidator = require('email-validator');
const { validateRequestBody, validateParams } = require('../middleware/validateMiddleware');
let transporter;

const codes = new Map(); // Store verification codes for email addresses

(async () => {
    try {
        transporter = await connectToEmailService(); 

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while connecting to email service',
        });
    }
})();



const generateVerificationCode = () => {
    
    let code = "";
    for (let i = 0; i < 6; i++) {
        const num = Math.floor(Math.random() * 10);
        code += num;
    }
    return code;
}

const verifyEmailCode = asyncHandler((req, res) => {
    if (!validateRequestBody(['_to', 'verification_code'], req, res) || !validateParams([], req, res)) return;
    const { _to, verification_code } = req.body;
    if (!_to || !verification_code) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if(codes.has(_to) && codes.get(_to) === verification_code) {
        codes.delete(_to); // Remove the code after successful verification
        return res.status(200).json({
            success: true,
            message: 'Email verified successfully'
        });
    } else {
        return res.status(400).json({
            success: false,
            message: 'Invalid verification code or email address'
        });
    }
});

const sendVerificationEmail = asyncHandler(async (req, res) => {
    if (!validateRequestBody(['_to'], req, res) || !validateParams([], req, res)) return;

    const { _to } = req.body;


    if (!_to ) {
        return res.status(400).json({
            success: false,
            message: 'Please provide all required fields'
        });
    }

    if(emailValidator.validate(_to) === false) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email address'
        });
    }
    try {
        if (!transporter) {
            transporter = await connectToEmailService(); 
        }
    const verificationCode = generateVerificationCode();
    codes.set(_to, verificationCode); // Store the code for the email address

    const _subject = 'QUT Researcher Thing Verification Code';
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #3a3a3aff;">
            <h2 style="color: #bebebeff;">Research Matchmaking Verification Code</h2>
            <p style="font-size: 16px; color: #eeeeee;">
                Your verification code is: <strong>${verificationCode}</strong>
            </p>
            <p style="font-size: 16px; color: #eeeeee;">Please enter this code at the signup page to verify your email address.</p>
            <br/>
            <p style="font-size: 14px; color: #c9c3d3ff;">If you did not request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #c9c3d3ff; margin: 20px 0;">
            <img src="cid:qutlogo" alt="QUT Logo" style="width: 100px;"/>
        </div>
    `;
    var mailOptions = {
        from: 'researchemailservice@gmail.com',
        to: _to,
        attachments: [{
            filename: 'qut-logo.png',
            path: __dirname + '/../assets/qut-logo-og-1200.jpg',
            cid: 'qutlogo'
        }],
        subject: _subject,
        html: html,

    };

  
    transporter.sendMail(mailOptions, function(error, info){
});
        res.status(200).json({
            success: true,
            message: 'Email sent successfully'
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error while sending email',
        });
    }
});



module.exports = { 
    sendVerificationEmail,
    verifyEmailCode,
};

