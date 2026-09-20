import { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { cleanExpiredRefreshToken, createAccessToken, createRefreshToken } from "../../../../lib/backend/authUtilities";
import { checkContentType, checkHttpMethod } from "../../../../lib/backend/middleware/http";
import User from "../../../../db/models/user";
import RefreshToken from "../../../../db/models/refreshToken";

type RefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse | RefreshTokenResponse>
) {
  if (!checkHttpMethod(req, res, ["POST"])) return;
  if (!checkContentType(req, res)) return;

  try {
    const { userId, refreshToken } = req.body;

    //check if input is present
    if (!userId || !refreshToken) {
      res.status(400).json({ message: "userId, refreshToken is missing." });
      return;
    }

    cleanExpiredRefreshToken();
    const refreshTokenObj = await RefreshToken.findByPk(refreshToken);
    if (!refreshTokenObj || refreshTokenObj.UserId !== Number(userId) || refreshTokenObj.validUntil < new Date()) {
      res.status(403).json({ message: "Refresh token is invalid or does not match user id." });
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ message: "User is not registrated." });
      return;
    }

    await refreshTokenObj.destroy();
    res.status(200).json({
      accessToken: createAccessToken(user),
      refreshToken: await createRefreshToken(user, refreshTokenObj.initialLogin),
    });
  } catch (err) {
    console.error("unknown error while refreshing token", err);
    res.status(500).json({ message: "Unknown error occurred." });
  }
}
