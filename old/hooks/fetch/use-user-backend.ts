import { ToastData } from "../../lib/frontend/toastData";
import useAuthFetch from "./use-auth-fetch";
import useToast from "../use-toast";
import { FrontendUser } from "../../lib/types/user";
import User from "../../db/models/user";

export class UserBackendError extends Error {}

function toFrontendUser(user: User): FrontendUser {
  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
  };
}

const useUserBackend = () => {
  const authFetch = useAuthFetch();
  const addToast = useToast();

  const getUser = async (userId: number | string): Promise<FrontendUser> => {
    return authFetch("GET", "/api/v1/users/" + userId).then((data) => {
      if (data?.status === 200) {
        return toFrontendUser(data.body);
      } else {
        addToast(new ToastData("Load User info", "Error occurred: " + data?.body.message, "danger"));
        throw new UserBackendError();
      }
    });
  };

  return {
    getUser,
  };
};

export default useUserBackend;
