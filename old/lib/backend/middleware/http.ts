import { NextApiRequest, NextApiResponse } from "next";
import { JsonResponse } from "../../frontend/customFetches";
import { SimpleMessageResponse } from "../responses";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class BackendError extends Error {}

export function checkHttpMethod(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>,
  methods: HttpMethod[]
): Boolean {
  if (!(methods as string[]).includes(req.method || "")) {
    res.status(405).setHeader("Allow", methods.join(",")).end();
    return false;
  }
  return true;
}

type SupportedContentType = "application/json";

export function checkContentType(
  req: NextApiRequest,
  res: NextApiResponse<SimpleMessageResponse>,
  contentTypeList?: SupportedContentType[]
): Boolean {
  if (!contentTypeList) contentTypeList = ["application/json"];

  if (!req.headers["content-type"] || !(contentTypeList as string[]).includes(req.headers["content-type"] || "")) {
    res.status(415).json({ message: "No or unsupported Content-Type specified." });
    return false;
  }
  return true;
}

export function handleStatus(data: JsonResponse): string {
  switch (data.status) {
    case 400:
      return "Bad request: " + (data.body.message ? data.body.message : "");
    case 401:
      return "You are not authorized for this action. " + (data.body.message ? data.body.message : "");
    case 403:
      return "You are not allowed to execute this action. " + (data.body.message ? data.body.message : "");
    case 404:
      return "The requested car does not exist.";
    default:
      throw new BackendError("Unhandled status: " + data.status);
  }
}
