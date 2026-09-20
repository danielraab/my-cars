import type { NextApiRequest, NextApiResponse } from "next";
import { SimpleMessageResponse } from "../responses";
import { verifyToken } from "../authUtilities";
import User from "../../../db/models/user";
import Car from "../../../db/models/car";

export async function isAuthorizedOrResponse(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>
): Promise<User | undefined> {
  if (!req.headers["authorization"]) {
    res.status(401).json({ message: "Authorization is missing." });
    return;
  }
  const tokenData = verifyToken(req.headers["authorization"].substring(7));

  if (!tokenData) {
    res.status(401).json({ message: "Token is invalid." });
    return;
  }

  const user = await User.findByPk(tokenData.id);
  if (user) return user;

  console.error("User of token not found.", tokenData);
  res.status(404).json({ message: "User of token not found." });
  return;
}

export async function isAuthorizedForUserOrResponse(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>,
  userId: string
): Promise<User | undefined> {
  if (!req.headers["authorization"]) {
    res.status(401).json({ message: "Authorization is missing." });
    return undefined;
  }

  const tokenData = verifyToken(req.headers["authorization"].substring(7));

  if (!tokenData) {
    res.status(401).json({ message: "Token is invalid." });
    return undefined;
  }

  if (tokenData.id == userId) {
    try {
      const user = await User.findByPk(userId);
      if (user) return user;
      else {
        res.status(404).json({ message: "User not found." });
        return undefined;
      }
    } catch (err) {
      console.error("error while getting user", err);
      res.status(500).json({ message: "Unknown error happend." });
      return;
    }
  } else {
    res.status(401).json({ message: "Unauthorized for this user." });
    return undefined;
  }

}

export async function isUserAuthorizedForCarOrResponse(
  res: NextApiResponse<SimpleMessageResponse>,
  user: User,
  carId: string
): Promise<Car | undefined> {
  const foundCar = await Car.findByPk(carId);

  if (!foundCar) {
    res.status(404).json({ message: "Car not found." });
    return;
  }

  if (foundCar.UserId !== user.id) {
    res.status(403).json({ message: "Car belongs to another user." });
    return;
  }
  return foundCar;
}
