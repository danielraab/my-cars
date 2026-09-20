import { jsonFetch, SupportedHttpMethods } from "../../lib/frontend/customFetches";
import { getValidAccessToken } from "../../lib/frontend/userService";
import { KeyValuePairs } from "../../lib/general";
import useAuth from "../use-auth";

class AuthError extends Error {}

function getAuthHeader(token: string) {
  return { Authorization: "Bearer " + token };
}

const useAuthFetch = () => {
  const { logout } = useAuth();

  const authFetch = async (method: SupportedHttpMethods, endpoint: string, data?: any, params?: KeyValuePairs) => {
    const accessToken = await getValidAccessToken();
    if (accessToken)
      return jsonFetch(
        method,
        process.env.NEXT_PUBLIC_APP_BACKEND_URL,
        endpoint,
        params,
        getAuthHeader(accessToken),
        data
      );
    else {
      logout();
      throw new AuthError("Unable to fetch data. Please login again.");
    }
  };

  return authFetch;
};

export default useAuthFetch;
