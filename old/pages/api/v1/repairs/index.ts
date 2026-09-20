import type { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../db/models/car";
import Repair from "../../../../db/models/repair";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Repair[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const repairs = await Repair.findAll({
      include: [
        {
          model: Car,
          required: true,
          attributes: [],
          where: {
            UserId: user.id,
          },
        },
      ],
      order: [["date", "ASC"]],
    });
    res.status(200).json(repairs);
  } catch (err) {
    console.log("error while find all repairs: ", err);
    res.status(500).json({ message: "error while finding all repairs" });
  }
}
