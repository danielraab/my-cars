import React, { useEffect, useState } from "react";
import { AuthInfo, FrontendUser, TokenInfo } from "../lib/types/user";
import { getTokenInfo, setToken } from "../lib/frontend/userService";
import useToast from "../hooks/use-toast";
import { ToastData } from "../lib/frontend/toastData";
import useUserBackend from "../hooks/fetch/use-user-backend";

export interface AuthContextType {
  currentAuth?: AuthInfo | null;
  updateAuthWithToken: (newToken: TokenInfo) => void;
  logout: () => void;
  checkToken: () => void;
}

const AuthContext = React.createContext<AuthContextType>({
  currentAuth: undefined,
  updateAuthWithToken: () => {},
  logout: () => {},
  checkToken: () => {},
});

export const AuthContextProvider = (props: { children: any }) => {
  const { getUser } = useUserBackend();
  const [currentAuth, setCurrentAuth] = useState<AuthInfo | undefined | null>();
  const addToast = useToast();

  function fetchUserAndSetAuth(tokenInfo: TokenInfo) {
    getUser(tokenInfo.id)
      .then((user) => {
        setCurrentAuth({ ...tokenInfo, user: user });
      })
      .catch((err) => {
        setToken("", "");
        setCurrentAuth(null);
      });
  }

  useEffect(() => {
    getTokenInfo().then((tokenInfo) => {
      if (tokenInfo) fetchUserAndSetAuth(tokenInfo);
      else setCurrentAuth(null);
    });
  }, []);

  const checkIfTokenIsValid = async () => {
    if (currentAuth) {
      const token = await getTokenInfo();
      if (!token) {
        addToast(new ToastData("Automatical logout", "Due to the elapsed token, you were logged off.", "danger"));
        setCurrentAuth(null);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(async () => {
      await checkIfTokenIsValid();
    }, Number(process.env.NEXT_PUBLIC_APP_TOKEN_CHECKTIME_IN_MS || 60000));
    return () => {
      clearInterval(timer);
    };
  });

  return (
    <AuthContext.Provider
      value={{
        currentAuth: currentAuth,
        updateAuthWithToken: (token: TokenInfo) => {
          fetchUserAndSetAuth(token);
        },
        logout: () => {
          setCurrentAuth(null);
          setToken("", "");
        },
        checkToken: checkIfTokenIsValid,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
