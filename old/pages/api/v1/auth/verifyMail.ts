import { NextApiRequest, NextApiResponse } from "next";
import User from "../../../../db/models/user";
import {
  checkContentType,
  checkHttpMethod,
} from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>
) {
  if (!checkHttpMethod(req, res, ["POST"])) return;
  if (!checkContentType(req, res)) return;

  const { userId, specialToken } = req.body;

  //check if input is present
  if (!userId || !specialToken) {
    res.status(400).json({ message: "userId or specialToken is missing." });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ message: "User is not registrated." });
    return;
  }

  if (user.specialToken === specialToken) {
    try {
      await User.update(
        {
          specialToken: null,
          isVerified: true,
        },
        { where: { id: user.id } }
      );
      res.status(200).json({ message: "User successfully verified." });
      return;
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to update user." });
      return;
    }
  } else {
    res.status(401).json({ message: "SpecialToken is not correct." });
    return;
  }
}
