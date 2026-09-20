import React, { useEffect, useState } from "react";
import SimpleFormInput from "../utilities/form/Input";
import Button from "../utilities/form/Button";
import Stack from "../utilities/helper/Stack";
import Spinner from "../utilities/helper/Spinner";
import { isEmailValid } from "../../lib/validation";
import useValidatedInput from "../../hooks/form/use-validated-input";
import useToast from "../../hooks/use-toast";
import { ToastData } from "../../lib/frontend/toastData";
import useAuth from "../../hooks/use-auth";
import useAuthFetch from "../../hooks/fetch/use-auth-fetch";
import useUserBackend from "../../hooks/fetch/use-user-backend";

const UserForm = () => {
  const { currentAuth, updateAuthWithToken } = useAuth({
    redirectTo: "/auth/login",
  });
  const authFetch = useAuthFetch();
  const getUser = useUserBackend();
  const [failedToSubmit, setFailedToSubmit] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addToast = useToast();

  const emailState = useValidatedInput<string>("", { validation: isEmailValid });
  const firstnameState = useValidatedInput<string>("");
  const lastnameState = useValidatedInput<string>("");

  const isFormValid = emailState.isValid && firstnameState.isValid && lastnameState.isValid;

  useEffect(() => {
    if (currentAuth) {
      emailState.setValue(currentAuth.user.email);
      firstnameState.setValue(currentAuth.user.firstname);
      lastnameState.setValue(currentAuth.user.lastname);
    }
  }, [currentAuth]); // eslint-disable-line react-hooks/exhaustive-deps

  const touchAllInputs = () => {
    emailState.setIsTouched(true);
    firstnameState.setIsTouched(true);
    lastnameState.setIsTouched(true);
  };

  const updateUser = (event: React.FormEvent) => {
    event.preventDefault();

    touchAllInputs();

    if (isFormValid) {
      const email = emailState.value;
      const firstname = firstnameState.value;
      const lastname = lastnameState.value;

      authFetch("PUT", "/api/v1/users/" + currentAuth?.id, {
        email,
        firstname,
        lastname,
      })
        .then((data) => {
          if (data?.status === 200) {
            updateAuthWithToken({ ...currentAuth!, email, firstname, lastname }); //TODO refresh token instead
            addToast(new ToastData("User updated", "User successfully update.", "success", true));
          } else {
            addToast(new ToastData("User update", "An error occured: " + data?.body.message, "warning"));
          }
        })
        .catch((err) => {
          console.error("error while user update fetch:", err);
          addToast(new ToastData("User update", "An unknown error occured", "danger"));
        });
    } else {
      setFailedToSubmit(true);
    }
  };

  return (
    <form onSubmit={updateUser}>
      <SimpleFormInput
        label="Email address"
        className="mb-3"
        controlProps={{
          type: "email",
          ...emailState.htmlElement,
        }}
        validation={{
          negativeFeedback: "Enter a valid Mail-Address.",
          ...emailState.validation,
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="Firstname"
        controlProps={{
          type: "text",
          ...firstnameState.htmlElement,
        }}
      />
      <SimpleFormInput
        className="mb-3"
        label="Lastname"
        controlProps={{
          type: "text",
          ...lastnameState.htmlElement,
        }}
      />
      <Stack horizontal>
        <Button btnClass="warning" type="submit" disabled={(!isFormValid && failedToSubmit) || isLoading}>
          update User
          {isLoading && <Spinner small useSpan className="ms-3" />}
        </Button>
      </Stack>
    </form>
  );
};

export default UserForm;
