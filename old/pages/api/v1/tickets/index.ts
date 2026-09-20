import type { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../db/models/car";
import Ticket from "../../../../db/models/ticket";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ticket[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const tickets = await Ticket.findAll({
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
    res.status(200).json(tickets);
  } catch (err) {
    console.log("error while find all tickets: ", err);
    res.status(500).json({ message: "error while finding all tickets" });
  }
}
