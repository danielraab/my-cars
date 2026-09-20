import type { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../db/models/car";
import User from "../../../../db/models/user";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkContentType, checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Car | Car[] | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "POST"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  if (req.method === "GET") {
    res.status(200).json(await user.getCars());
    return;
  } else if (req.method === "POST") {
    if (!checkContentType(req, res)) return;

    await handleCreate(req, res, user);
  }
}

async function handleCreate(req: NextApiRequest, res: NextApiResponse<Car | SimpleMessageResponse>, user: User) {
  const { name, type, carMake, fuel, firstRegistration, licensePlate, fin, isActive, purchaseDate, purchasePrice } =
    req.body;

  if (!name || !type) {
    res.status(400).json({ message: "Name and Type must be set!" });
    return;
  }

  const newCar = await user.createCar({
    name,
    type,
    carMake,
    fuel,
    firstRegistration,
    licensePlate,
    fin,
    isActive,
    purchaseDate,
    purchasePrice,
  });
  res.status(201).json(newCar);
  return;
}
