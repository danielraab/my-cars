import { NextApiRequest, NextApiResponse } from "next";
import Repair from "../../../../db/models/repair";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Repair | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "PUT", "DELETE"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const repairId = req.query.repairId as string;
  const repair = await Repair.findByPk(repairId);
  if (!repair) {
    res.status(404).json({ message: "Repair not found." });
    return;
  }

  const car = await isUserAuthorizedForCarOrResponse(res, user, repair.CarId.toString());
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(repair);
    return;
  } else if (req.method === "PUT") {
    handleUpdate(req, res, repair);
    return;
  } else if (req.method === "DELETE") {
    await repair.destroy();
    res.status(200).json({ message: "Repair successfully deleted." });
    return;
  }
}

async function handleUpdate(req: NextApiRequest, res: NextApiResponse<Repair | SimpleMessageResponse>, repair: Repair) {
  const { date, station, odometerReading, type, amount, description } = req.body;

  if (date) repair.date = new Date(date);
  if (station) repair.station = station;
  if (odometerReading) repair.odometerReading = odometerReading;
  if (type) repair.type = type;
  if (amount) repair.amount = amount;
  if (description) repair.description = description;

  await repair.save();

  res.status(200).json(repair);
  return;
}
