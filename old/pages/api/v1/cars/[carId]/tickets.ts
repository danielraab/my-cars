import { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../../db/models/car";
import Ticket from "../../../../../db/models/ticket";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../../lib/backend/middleware/auth";
import { checkContentType, checkHttpMethod } from "../../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../../lib/backend/responses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ticket | Ticket[] | SimpleMessageResponse>
) {
  if (!checkHttpMethod(req, res, ["GET", "POST"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const carId = req.query.carId as string;
  const car = await isUserAuthorizedForCarOrResponse(res, user, carId);
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(await car.getTickets({ order: [["date", "ASC"]] }));
  } else if (req.method === "POST") {
    if (!checkContentType(req, res)) return;

    await handleCreate(req, res, car);
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse<Ticket | SimpleMessageResponse>, car: Car) {
  const { date, type, location, amount, description } = req.body;

  if (!date) {
    res.status(400).json({ message: "Date must be set!" });
    return;
  }

  const createdTicket = await car.createTicket({
    date,
    type,
    location,
    amount,
    description,
  });
  res.status(201).json(createdTicket);
  return;
}
