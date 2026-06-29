const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendEmail = async ({ to, subject, html }) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'ProntoX <noreply@pronto.ai>',
            to,
            subject,
            html,
        });
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error('Email error:', error);
        // Don't throw – we don't want to block the redemption if email fails
    }
};

module.exports = sendEmail;