import nodemailer from "nodemailer";

let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === '1',
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
})

async function sendErrorEmail({subject, html}) {
    return transporter.sendMail({
        from: process.env.SMTP_EMAIL_FROM, // sender address
        to: process.env.ADMIN_EMAIL,
        subject: `${subject} ~ STAT to GBQ`,
        html: html,
    })
}

export {sendErrorEmail}
