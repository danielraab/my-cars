import { randomUUID } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { sendPasswordResetMail } from "../../../../lib/backend/mailService";
import {
  checkContentType,
  checkHttpMethod,
} from "../../../../lib/backend/middleware/http";
import User from "../../../../db/models/user";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>
) {
  if (!checkHttpMethod(req, res, ["POST"])) return;
  if (!checkContentType(req, res)) return;

  //check if input is present
  if (!req.body.email) {
    res.status(400).json({ message: "Email is missing." });
    return;
  }

  const user = await User.findOne({ where: { email: req.body.email } });
  if (!user) {
    res.status(404).json({ message: "Mail is not registrated." });
    return;
  }

  try {
    const newSpecialToken = randomUUID();

    await User.update(
      { specialToken: newSpecialToken },
      { where: { email: req.body.email } }
    );

    sendPasswordResetMail({
      to: user.email,
      token: newSpecialToken,
      userId: user.id,
    });
    res.status(200).json({ message: "Password reset link has been sent." });
    return;
  } catch (err) {
    // error while sending mail, but user is created
    res.status(500).json({
      message: "Error while sending password reset link.",
    });
    return;
  }
}
