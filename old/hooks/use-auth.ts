import { useRouter } from "next/router";
import { useContext, useEffect } from "react";
import AuthContext, { AuthContextType } from "../context/auth-context";

type UseAuthProps = {
  redirectTo?: string
  redirectLoggedInTo?: string
}

const useAuth = (props?: UseAuthProps) => {
  const authContext: AuthContextType = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {

    if(props) {
      if (authContext.currentAuth && props.redirectLoggedInTo) router.push(props.redirectLoggedInTo);
      if (authContext.currentAuth === null && props.redirectTo) router.push(props.redirectTo);
    }
  }, [authContext, props, router]);

  return authContext
};

export default useAuth;
