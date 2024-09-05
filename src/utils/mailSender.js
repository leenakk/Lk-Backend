import nodemailer from "nodemailer"
import asyncHandler from "./asyncHandler.js";
import { apiResponse } from "./apiResponse.js";

export const sendMail = asyncHandler(async ({ from, emails, subject, html, text }) => {
    const transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
            user: 'A7la-lk@hotmail.com',
            pass: 'zxlgypmemslgnqju'
        }
    });

    const mailOptions = {
        from: from,
        to: emails,
        subject: subject,
        html: html,
        plainText: text

    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.error(error);
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json(new apiResponse(200, { info } , "Email Sent successfully"))

    });

})
