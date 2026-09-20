import React, { FormEventHandler, useState } from "react";
import SimpleFormInput from "../utilities/form/Input";
import { Col } from "../utilities/layout/Container";
import Button from "../utilities/form/Button";
import Stack from "../utilities/helper/Stack";
import Spinner from "../utilities/helper/Spinner";
import { isEmailValid, isPasswordValid } from "../../lib/validation";
import useValidatedInput from "../../hooks/form/use-validated-input";
import useToast from "../../hooks/use-toast";
import { ToastData } from "../../lib/frontend/toastData";
import { jsonFetch } from "../../lib/frontend/customFetches";
import { RegistrationUser } from "../../lib/types/user";
import Link from "next/link";
import useAuth from "../../hooks/use-auth";

const RegisterForm = () => {
  useAuth({ redirectLoggedInTo: "/home" });
  const [failedToSubmit, setFailedToSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addToast = useToast();

  const emailState = useValidatedInput("", { validation: isEmailValid });
  const passwordState = useValidatedInput("", { validation: isPasswordValid });

  const isFormValid = emailState.isValid && passwordState.isValid;

  const clearFormHandler: FormEventHandler = (e) => {
    e.preventDefault();

    clearForm();
  };

  const clearForm = () => {
    emailState.clear();
    passwordState.clear();

    setFailedToSubmit(false);
  };

  const touchAllInputs = () => {
    emailState.setIsTouched(true);
    passwordState.setIsTouched(true);
  };

  const registerNewUser = (event: React.FormEvent) => {
    event.preventDefault();

    touchAllInputs();

    if (isFormValid) {
      const newUser: RegistrationUser = {
        email: emailState.value,
        password: passwordState.value,
      };

      jsonFetch("POST", process.env.NEXT_PUBLIC_APP_BACKEND_URL, "/api/v1/auth/register", undefined, undefined, newUser)
        .then((data) => {
          if (data.status === 201) {
            addToast(
              new ToastData(
                "User registration",
                "User successfully registrated. Check your mail for the verification mail.",
                "success"
              )
            );
            clearForm();
          } else {
            addToast(new ToastData("User registration", "An error occured: " + data.body.message, "warning"));
          }
        })
        .catch((err) => {
          console.error("error while registration fetch:", err);
          addToast(new ToastData("User registration", "An unknown error occured", "danger"));
        });
    } else {
      setFailedToSubmit(true);
    }
  };

  return (
    <Col className="col-lg-6">
      <form onSubmit={registerNewUser}>
        <SimpleFormInput
          className="mb-3"
          label="Email address"
          controlProps={{
            type: "email",
            ...emailState.htmlElement,
            autoFocus: true,
          }}
          validation={{
            negativeFeedback: "Enter a valid Mail-Address.",
            ...emailState.validation,
          }}
        />
        <SimpleFormInput
          className="mb-3"
          label="Password"
          controlProps={{
            type: "password",
            ...passwordState.htmlElement,
          }}
          validation={{
            ...passwordState.validation,
            negativeFeedback: "Password must have min 8 characters, at least one letter and one number.",
          }}
        />
        <Stack horizontal>
          <Button btnClass="secondary" onClick={clearFormHandler}>
            Reset
          </Button>
          <Link href="/auth/login" className="link-primary ms-auto me-3">
            login now
          </Link>
          <Button btnClass="primary" type="submit" disabled={(!isFormValid && failedToSubmit) || isLoading}>
            Register
            {isLoading && <Spinner small useSpan className="ms-3" />}
          </Button>
        </Stack>
      </form>
    </Col>
  );
};

export default RegisterForm;
