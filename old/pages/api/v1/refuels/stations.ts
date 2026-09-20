import type { NextApiRequest, NextApiResponse } from "next";
import Refuel from "../../../../db/models/refuel";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<string[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const stations = await Refuel.findAll({
      attributes: ["station"],
      order: [["station", "ASC"]],
    });
    res.status(200).json(stations.map((refuel)=>{return refuel.station}));
  } catch (err) {
    console.log("error while find all refuel stations: ", err);
    res.status(500).json({ message: "error while finding all refuel stations" });
  }
}
