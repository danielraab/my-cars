import { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../../db/models/car";
import Refuel from "../../../../../db/models/refuel";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../../lib/backend/middleware/auth";
import { checkContentType, checkHttpMethod } from "../../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../../lib/backend/responses";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Refuel | Refuel[] | SimpleMessageResponse>
) {
  if (!checkHttpMethod(req, res, ["GET", "POST"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const carId = req.query.carId as string;
  const car = await isUserAuthorizedForCarOrResponse(res, user, carId);
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(await car.getRefuels({ order: [["date", "ASC"]] }));
  } else if (req.method === "POST") {
    if (!checkContentType(req, res)) return;

    await handleCreate(req, res, car);
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse<Refuel | SimpleMessageResponse>, car: Car) {
  const { date, station, odometerReading, fuel, liter, amount } = req.body;

  if (!date || !station || !liter) {
    res.status(400).json({ message: "Date, Station and Liter must be set!" });
    return;
  }

  const createdRefuel = await car.createRefuel({
    date,
    station,
    odometerReading,
    fuel,
    liter,
    amount,
  });
  res.status(201).json(createdRefuel);
  return;
}
