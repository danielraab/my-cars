import { TokenInfo } from "../types/user";
import jwt from "jsonwebtoken";
import { jsonFetch } from "./customFetches";

const LOCAL_STORAGE_ACCESS_TOKEN = "accessToken";
const LOCAL_STORAGE_REFRESH_TOKEN = "refreshToken";

export const setToken = (accessToken: string, refreshToken?: string) => {
  localStorage.setItem(LOCAL_STORAGE_ACCESS_TOKEN, accessToken);
  if (refreshToken !== undefined) localStorage.setItem(LOCAL_STORAGE_REFRESH_TOKEN, refreshToken);
};

export const getAccessToken = (): string | null => {
  if (!localStorage) return null;
  const token = localStorage.getItem(LOCAL_STORAGE_ACCESS_TOKEN);
  if (token && token.length >= 0) return token;
  return null;
};
export const getRefreshToken = () => {
  if (!localStorage) return undefined;
  const token = localStorage.getItem(LOCAL_STORAGE_REFRESH_TOKEN);
  if (token && token.length >= 0) return token;
  return null;
};

export function isTokenValid(auth: TokenInfo): boolean {
  return !!auth.exp && auth.exp > new Date().getTime() / 1000;
}
export function isAccessTokenValid(token: string): boolean {
  const tokenInfo = jwt.decode(token) as TokenInfo;
  return isTokenValid(tokenInfo);
}

/**
 * try to get access token. current stored is not valid, try to refresh it.
 * @returns valid access token, if present, null otherwise (as a promise)
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  if (isAccessTokenValid(accessToken)) return accessToken;
  const refreshToken = getRefreshToken();
  const tokenInfo = jwt.decode(accessToken) as TokenInfo;
  if (refreshToken && tokenInfo) {
    try {
      const data = await jsonFetch(
        "POST",
        process.env.NEXT_PUBLIC_APP_BACKEND_URL,
        "/api/v1/auth/refreshToken",
        undefined,
        undefined,
        {
          userId: tokenInfo.id,
          refreshToken: refreshToken,
        }
      );
      if (data.status === 200) {
        setToken(data.body.accessToken, data.body.refreshToken);
        return data.body.accessToken;
      } else {
        setToken("", "");
        console.log("error while refreshing token", data);
        return null;
      }
    } catch (err) {
      console.log("error while refreshing token", err);
      return null;
    }
  }
  return null;
};

/**
 *
 * @returns a TokenInfo promise if available.
 * If token is expired, a refresh will be tried.
 */
export const getTokenInfo = async (): Promise<TokenInfo | null> => {
  const accessToken = await getValidAccessToken();

  if (accessToken) {
    const tokenInfo = jwt.decode(accessToken) as TokenInfo;
    if (isTokenValid(tokenInfo)) return tokenInfo;
    else return null;
  }
  return null;
};
