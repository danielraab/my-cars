import type { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { compareHashedPassword, createAccessToken, createRefreshToken } from "../../../../lib/backend/authUtilities";
import { checkContentType, checkHttpMethod } from "../../../../lib/backend/middleware/http";
import User from "../../../../db/models/user";

type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse | SimpleMessageResponse>
) {
  if (!checkHttpMethod(req, res, ["POST"])) return;
  if (!checkContentType(req, res)) return;

  const { email, password } = req.body;

  //check if input is present
  if (!email || !password) {
    res.status(400).json({ message: "Email or password missing." });
    return;
  }

  //check if mail is already registrated
  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404).json({ message: "Mail not found." });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ message: "User is not verified." });
    return;
  }

  if (user.hashedPassword && compareHashedPassword(password, user.hashedPassword)) {
    res.status(200).json({
      accessToken: createAccessToken(user),
      refreshToken: await createRefreshToken(user),
    });
  } else {
    res.status(401).json({ message: "Password is not correct." });
  }

  return;
}
