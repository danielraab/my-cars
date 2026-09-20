import type { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../db/models/car";
import Refuel from "../../../../db/models/refuel";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Refuel[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const refuels = await Refuel.findAll({
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
    res.status(200).json(refuels);
  } catch (err) {
    console.log("error while find all refuels: ", err);
    res.status(500).json({ message: "error while finding all refuels" });
  }
}
