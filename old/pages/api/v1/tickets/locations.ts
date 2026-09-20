import type { NextApiRequest, NextApiResponse } from "next";
import Ticket from "../../../../db/models/ticket";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<string[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const locations = await Ticket.findAll({
      attributes: ["location"],
      order: [["location", "ASC"]],
    });
    res.status(200).json(
      locations.map((ticket) => {
        return ticket.location;
      })
    );
  } catch (err) {
    console.log("error while find all ticket locations: ", err);
    res.status(500).json({ message: "error while finding all ticket locations" });
  }
}
