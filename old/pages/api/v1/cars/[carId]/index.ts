import { NextApiRequest, NextApiResponse } from "next";
import Car from "../../../../../db/models/car";
import User from "../../../../../db/models/user";
import { isAuthorizedOrResponse, isUserAuthorizedForCarOrResponse } from "../../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<Car | SimpleMessageResponse>) {
  if (!checkHttpMethod(req, res, ["GET", "PUT", "DELETE"])) return;

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const carId = req.query.carId as string;
  const car = await isUserAuthorizedForCarOrResponse(res, user, carId);
  if (!car) return;

  if (req.method === "GET") {
    res.status(200).json(car);
    return;
  } else if (req.method === "PUT") {
    handleUpdate(req, res, car, user);
    return;
  } else if (req.method === "DELETE") {
    await car.destroy();
    res.status(200).json({ message: "Car successfully deleted." });
    return;
  }
}

async function handleUpdate(
  req: NextApiRequest,
  res: NextApiResponse<Car | SimpleMessageResponse>,
  car: Car,
  user: User
) {
  const { name, type, carMake, fuel, firstRegistration, licensePlate, fin, isActive, purchaseDate, purchasePrice } =
    req.body;

  if (car.UserId !== user.id) {
    res.status(403).json({ message: "Car belongs to another user." });
    return;
  }

  if (name) car.name = name;
  if (type) car.type = type;
  if (carMake) car.carMake = carMake;
  if (fuel) car.fuel = fuel;
  if (firstRegistration) car.firstRegistration = firstRegistration;
  if (licensePlate) car.licensePlate = licensePlate;
  if (isActive) car.isActive = isActive;
  if (fin) car.fin = fin;
  if (purchaseDate) car.purchaseDate = purchaseDate;
  if (purchasePrice) car.purchasePrice = purchasePrice;

  await car.save();

  res.status(200).json(car);
  return;
}
