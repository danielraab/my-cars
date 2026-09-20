import type { NextApiRequest, NextApiResponse } from "next";
import Repair from "../../../../db/models/repair";
import { isAuthorizedOrResponse } from "../../../../lib/backend/middleware/auth";
import { checkHttpMethod } from "../../../../lib/backend/middleware/http";
import { SimpleMessageResponse } from "../../../../lib/backend/responses";

export default async function handler(req: NextApiRequest, res: NextApiResponse<string[] | SimpleMessageResponse>) {
  checkHttpMethod(req, res, ["GET"]);

  const user = await isAuthorizedOrResponse(req, res);
  if (!user) return;

  try {
    const stations = await Repair.findAll({
      attributes: ["station"],
      order: [["station", "ASC"]],
    });
    res.status(200).json(stations.map((repair)=>{return repair.station}));
  } catch (err) {
    console.log("error while find all repair stations: ", err);
    res.status(500).json({ message: "error while finding all repair stations" });
  }
}
