import { NextApiRequest, NextApiResponse } from "next";
import Ticket from "../../../../db/models/ticket";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ticket | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "PUT", "DELETE"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const ticketId = req.query.ticketId as string;
  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) {
    res.status(404).json({ message: "Ticket not found." });
    return;
  }

  const car = await isUserAuthorizedForCarOrResponse(res, user, ticket.CarId.toString());
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(ticket);
    return;
  } else if (req.method === "PUT") {
    handleUpdate(req, res, ticket);
    return;
  } else if (req.method === "DELETE") {
    await ticket.destroy();
    res.status(200).json({ message: "Ticket successfully deleted." });
    return;
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse<Ticket | SimpleMessageResponse>, ticket: Ticket) {
  const { date, type, location, amount, description } = req.body;

  if (date) ticket.date = new Date(date);
  if (type) ticket.type = type;
  if (location) ticket.location = location;
  if (amount) ticket.amount = amount;
  if (description) ticket.description = description;

  await ticket.save();

  res.status(200).json(ticket);
  return;
}
