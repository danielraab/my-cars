import { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { hashPassword } from "../../../../lib/backend/authUtilities";
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

  try {
    const { userId, specialToken, password } = req.body;

    //check if input is present
    if (!userId || !password) {
      res
        .status(400)
        .json({ message: "userId, specialToken or password is missing." });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User is not registrated." });
      return;
    }

    if (user.specialToken === specialToken) {
      await User.update(
        {
          specialToken: null,
          isVerified: true,
          hashedPassword: hashPassword(password),
        },
        { where: { id: user.id } }
      );
      res.status(200).json({ message: "New password successful set." });
    } else {
      res.status(401).json({ message: "SpecialToken is not correct." });
    }
  } catch (err) {
    console.error("unknown error while resetting password", err);
    res.status(500).json({ message: "Unknown error occurred." });
  }
}
