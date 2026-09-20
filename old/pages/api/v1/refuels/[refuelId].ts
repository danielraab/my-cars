import { NextApiRequest, NextApiResponse } from "next";
import Refuel from "../../../../db/models/refuel";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Refuel | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "PUT", "DELETE"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const refuelId = req.query.refuelId as string;
  const refuel = await Refuel.findByPk(refuelId);
  if (!refuel) {
    res.status(404).json({ message: "Refuel not found." });
    return;
  }

  const car = await isUserAuthorizedForCarOrResponse(res, user, refuel.CarId.toString());
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(refuel);
    return;
  } else if (req.method === "PUT") {
    handleUpdate(req, res, refuel);
    return;
  } else if (req.method === "DELETE") {
    await refuel.destroy();
    res.status(200).json({ message: "Refuel successfully deleted." });
    return;
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse<Refuel | SimpleMessageResponse>, refuel: Refuel) {
  const { date, station, odometerReading, fuel, liter, amount } = req.body;

  if (date) refuel.date = new Date(date);
  if (station) refuel.station = station;
  if (odometerReading) refuel.odometerReading = odometerReading;
  if (fuel) refuel.fuel = fuel;
  if (liter) refuel.liter = liter;
  if (amount) refuel.amount = amount;

  await refuel.save();

  res.status(200).json(refuel);
  return;
}
