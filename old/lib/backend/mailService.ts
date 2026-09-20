import mailTransporter from "../../config/mailer";

type SpecialTokenMailData = {
  to: string;
  userId: string|number;
  token: string;
};

export function isVerificationMailEnabled() {
  return process.env.APP_SEND_VERIFICATION_MAIL == "true";
}

export async function sendVerificationMail(mailData: SpecialTokenMailData) {
  const link = `${process.env.APP_FRONTEND_URL}/auth/mailVerification/${mailData.userId}/${mailData.token}`;

  try {
    await mailTransporter.sendMail({
      from: process.env.APP_MAIL_FROM,
      to: mailData.to,
      subject: "Verification for " + process.env.NEXT_PUBLIC_APP_NAME,
      html: `<p>Please click on the link to verify your mail address: <a href="${link}">Link</a> (${link})`,
    });
  } catch (err: any) {
    console.error(`Error while sending mail to ${mailData.to}`, err);
    throw err;
  }
}

export async function sendPasswordResetMail(mailData: SpecialTokenMailData) {
  const link = `${process.env.APP_FRONTEND_URL}/auth/passwordReset/${mailData.userId}/${mailData.token}`;

  try {
    await mailTransporter.sendMail({
      from: process.env.APP_MAIL_FROM,
      to: mailData.to,
      subject: "Reset password for " + process.env.NEXT_PUBLIC_APP_NAME,
      html: `<p>Please click on the link to reset your password: <a href="${link}">Link</a> (${link})`,
    });
  } catch (err: any) {
    console.error(`Error while sending mail to ${mailData.to}`, err);
    throw err;
  }
}
