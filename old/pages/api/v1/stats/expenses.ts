import { NextApiRequest, NextApiResponse } from "next";
import { Op } from "sequelize";
import { WhereOptions } from "sequelize";
import Car from "../../../../db/models/car";
import Refuel from "../../../../db/models/refuel";
import Repair from "../../../../db/models/repair";
import Ticket from "../../../../db/models/ticket";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";
import { AmountStats } from "../../../../lib/types/stats";

export interface ExpensesResponse {
  refuels: AmountStats[];
  repairs: AmountStats[];
  tickets: AmountStats[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExpensesResponse | SimpleMessageResponse>
) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  const { from, to } = req.query;

  let whereClause: WhereOptions<any> | undefined = undefined;
  if (from || to) {
    let fromParam = {};
    let toParam = {};
    if (from) fromParam = { [Op.gte]: new Date(from as string) };
    if (to) toParam = { [Op.lt]: new Date(to as string) };
    whereClause = { date: { ...fromParam, ...toParam } };
  }

  try {
    const refuels = await Refuel.findAll({
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
      where: whereClause,
      attributes: ["id", "date", "amount", "CarId"],
      order: [["date", "ASC"]],
    });
    const repairs = await Repair.findAll({
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
      where: whereClause,
      attributes: ["id", "date", "amount", "CarId"],
      order: [["date", "ASC"]],
    });
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
      where: whereClause,
      attributes: ["id", "date", "amount", "CarId"],
      order: [["date", "ASC"]],
    });
    res.status(200).json({ refuels, repairs, tickets });
  } catch (err) {
    console.log("error while find all tickets: ", err);
    res.status(500).json({ message: "error while finding all tickets" });
  }
}
