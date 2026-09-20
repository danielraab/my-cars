import { KeyValuePairs } from "../general";

export type SupportedHttpMethods = "DELETE" | "GET" | "POST" | "PUT";
export type JsonResponse = {
  headers: Headers;
  status: number;
  body: any;
};

export const jsonFetch = async (
  method: SupportedHttpMethods,
  baseUrl: string | undefined,
  endpoint: string,
  params?: KeyValuePairs,
  headers?: KeyValuePairs,
  data?: any
): Promise<JsonResponse> => {
  let url = (baseUrl || "") + endpoint;

  //create parameter string
  let paramsString = "";
  if (params)
    paramsString =
      "?" +
      Object.keys(params)
        .map((k) => `${k}=${params[k]}`)
        .join("&");

  console.debug("fetch " + method + " " + url + paramsString);

  return fetch(url + paramsString, {
    method: method,
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...headers,
    },
  }).then(async (response) => {
    let body = {}
    try {
      body = await response.json()
    } catch(e) {console.log("failed in json decode response", e);}
    return {
      headers: response.headers,
      status: response.status,
      body,
    };
  });
};
