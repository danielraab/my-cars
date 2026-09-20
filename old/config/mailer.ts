import nodemailer from "nodemailer";

const mailTransporter = nodemailer.createTransport({
  host: process.env.APP_MAIL_HOST || "localhost",
  port: parseInt(process.env.APP_MAIL_PORT || "25"),
  secure: process.env.APP_MAIL_SECURE === "true",
  //   requireTLS: true,
  auth: {
    user: process.env.APP_MAIL_USERNAME,
    pass: process.env.APP_MAIL_PASSWORD,
  },
  //   logger: true,
});

export default mailTransporter;
