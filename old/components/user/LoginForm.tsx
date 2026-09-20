import React, { useEffect, useRef, useState } from "react";
import SimpleFormCheckbox from "../utilities/form/Checkbox";
import SimpleFormInput from "../utilities/form/Input";
import useAuth from "../../hooks/use-auth";
import Button from "../utilities/form/Button";
import { Col } from "../utilities/layout/Container";
import Stack from "../utilities/helper/Stack";
import Link from "next/link";
import { jsonFetch } from "../../lib/frontend/customFetches";
import useToast from "../../hooks/use-toast";
import { ToastData } from "../../lib/frontend/toastData";
import { getTokenInfo, setToken } from "../../lib/frontend/userService";

const PREFILLED_EMAIL_LOCAL_STORAGE_KEY = "prefilledEmail";

const LoginForm = () => {
  const { updateAuthWithToken, logout } = useAuth({ redirectLoggedInTo: "/home" });
  const addToast = useToast();
  const [email, setEmail] = useState("");

  const passwordFormControl = useRef<HTMLInputElement>(null);
  const rememberUserFormCheck = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // preload email if stored in the local storage of the browser
    let lsEmail = localStorage.getItem(PREFILLED_EMAIL_LOCAL_STORAGE_KEY);
    if (lsEmail) setEmail(lsEmail);
  }, []);

  const login = (event: React.FormEvent) => {
    event.preventDefault();

    // store the email in the local storage of the browser if flag is set
    if (rememberUserFormCheck.current?.checked && email) {
      localStorage.setItem(PREFILLED_EMAIL_LOCAL_STORAGE_KEY, email);
    }

    const loginBody = {
      email: email,
      password: passwordFormControl.current?.value,
    };

    jsonFetch("POST", process.env.NEXT_PUBLIC_APP_BACKEND_URL, "/api/v1/auth/login", undefined, undefined, loginBody)
      .then((data) => {
        if (data.status === 200) {
          setToken(data.body.accessToken, data.body.refreshToken);
          getTokenInfo().then((tokenInfo) => {
            if (tokenInfo) updateAuthWithToken(tokenInfo);
            else logout();
          });
          addToast(new ToastData("Login", "Login successful", "success", true));
        } else if (data.status === 401 || data.status === 404) {
          addToast(new ToastData("Login", "Mail not found or password incorrect.", "danger"));
        } else if (data.status === 403) {
          addToast(new ToastData("Login", "Not allowed to login: " + data.body.message, "warning"));
        } else {
          console.log("unable to login", data);
          addToast(new ToastData("Login", "Unable to login.", "danger"));
        }
      })
      .catch((err) => {
        console.log("error while login fetch", err);
        addToast(new ToastData("Login", "Unable to login.", "danger"));
      });
  };

  return (
    <Col className="col-lg-6">
      <form onSubmit={login}>
        <SimpleFormInput
          className="mb-3"
          label="Email"
          controlProps={{
            type: "text",
            autoComplete: "email",
            value: email,
            autoFocus: true,
            onChange: (e) => setEmail(e.target.value),
          }}
        />
        <SimpleFormInput
          className="mb-3"
          label="Password"
          ref={passwordFormControl}
          controlProps={{
            type: "password",
            autoComplete: "current-password",
          }}
        />

        <Stack horizontal className="mb-3">
          <SimpleFormCheckbox ref={rememberUserFormCheck} label="Remember Me" />
          <Link href="/auth/passwordForgotten" className="link-primary ms-auto">
            Password forgotten
          </Link>
        </Stack>
        <Stack horizontal>
          <Button btnClass="primary" type="submit">
            Login
          </Button>
          <Link href="/auth/register" className="link-primary ms-3">
            or register now
          </Link>
        </Stack>
      </form>
    </Col>
  );
};

export default LoginForm;
