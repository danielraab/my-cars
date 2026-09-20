import { randomUUID } from "crypto";
import type { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { isVerificationMailEnabled, sendVerificationMail } from "../../../../lib/backend/mailService";
import { hashPassword } from "../../../../lib/backend/authUtilities";
import { checkContentType, checkHttpMethod } from "../../../../lib/backend/middleware/http";
import User from "../../../../db/models/user";

type RegisterResponse = {
  user: {
    email: string;
    isVerified: boolean;
    id: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse | SimpleMessageResponse>
) { 
  if(!checkHttpMethod(req, res, ["POST"])) return;
  if (!checkContentType(req, res)) return;

  const {email, password} = req.body;

  //check if input is present
  if (!email || !password) {
    res.status(400).json({ message: "Email or password missing." });
    return;
  }

  //check if mail is already registrated
  const user = await User.findOne({where: {email}});
  if (user) {
    res.status(400).json({ message: "Mail is already registrated." });
    return;
  }

  let newUser:any = {
    email,
    hashedPassword: hashPassword(password)
  };

  let addedUser:User;

  //check if a verification mail has to be sent
  if (isVerificationMailEnabled()) {
    newUser.isVerified = false;
    newUser.specialToken = randomUUID();

    addedUser = await User.create(newUser); //TODO try catch

    try {
      await sendVerificationMail({
        to: addedUser.email,
        token: addedUser.specialToken!,
        userId: addedUser.id.toString(),
      });
    } catch (err) {
      // error while sending mail, but user is created
      res.status(500).json({
        message: "Error while sending verification mail to the mail.",
      });
      return;
    }
  } else {
    newUser.isVerified = true;
    addedUser = await User.create(newUser); //TODO try catch
  }

  res.status(201).json({
    user: {
      id: addedUser.id.toString(),
      email: addedUser.email,
      isVerified: addedUser.isVerified!,
    },
  });
}
