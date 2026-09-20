import { faUser } from "@fortawesome/free-solid-svg-icons";
import type { NextApiRequest, NextApiResponse } from "next";
import User from "../../../../db/models/user";
import { isAuthorizedForUserOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkContentType, checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { FrontendUser } from "../../../../lib/types/user";

export default async function handler(req: NextApiRequest, res: NextApiResponse<FrontendUser | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "PUT"])) return;

  const userId = req.query.userId as string;
  const user = await isAuthorizedForUserOrResponse(req, res, userId);
  if (!user) return;

  if (req.method === "GET") {
    res.status(200).json({
      id: userId,
      email: user.email,
      firstname: user.firstname || "",
      lastname: user.lastname || "",
    });
    return;
  } else if (req.method === "PUT") {
    if (!checkContentType(req, res)) return;

    const { email, firstname, lastname } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email must be set!" });
      return;
    }

    if (email != user.email) {
      //check if mail already exists

      const found = await User.findOne({ where: { email } });
      if (found) {
        res.status(400).json({ message: "Mail is already taken by another user." });
        return;
      }
    }

    try {
      await User.update(
        {
          email,
          firstname,
          lastname,
        },
        { where: { id: userId } }
      );
      // console.log(req.body);
      res.status(200).json({ message: "User successfully updated." });
      return;
    } catch (err) {
      console.error("error while updating user: ", err);
      res.status(500).json({ message: "Unknown error occurred." });
      return;
    }
  }
}
