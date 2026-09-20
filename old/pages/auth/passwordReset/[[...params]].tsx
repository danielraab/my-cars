import { useRouter } from "next/router";
import { useState } from "react";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import Button from "../../../components/utilities/form/Button";
import SimpleFormInput from "../../../components/utilities/form/Input";
import Alert from "../../../components/utilities/helper/Alert";
import Stack from "../../../components/utilities/helper/Stack";
import { Col, Row } from "../../../components/utilities/layout/Container";
import useValidatedInput from "../../../hooks/form/use-validated-input";
import { Variants } from "../../../lib/frontend/bootstrap.t";
import { jsonFetch } from "../../../lib/frontend/customFetches";
import { isPasswordValid } from "../../../lib/validation";

type ResetState = {
  status: Variants | undefined;
  message: string;
};

export default function PasswordReset() {
  const router = useRouter();
  const [resetState, setResetState] = useState<ResetState>({ status: undefined, message: "" });
  const passwordState = useValidatedInput("", { validation: isPasswordValid });

  const sendPasswordReset = (event: React.FormEvent) => {
    event.preventDefault();

    const [userId, specialToken] = router.query.params as string[];

    jsonFetch("POST", process.env.NEXT_PUBLIC_APP_BACKEND_URL, "/api/v1/auth/resetPassword", undefined, undefined, {
      userId,
      specialToken,
      password: passwordState.htmlElement.value,
    })
      .then((data) => {
        if (data.status === 200) {
          setResetState({ status: "success", message: "New password has been successfully set." });
          passwordState.clear();
        } else {
          setResetState({ status: "danger", message: "Failed to set password: " + data.body.message });
        }
      })
      .catch((err) => {
        console.error("failed to reset password fetch", err);
        setResetState({ status: "danger", message: "Failed to set password." });
      });
  };

  return (
    <>
      <SimplePageWrapper title="Reset password:">
        {resetState.status && <Alert variant={resetState.status}>{resetState.message}</Alert>}
        {!resetState.status && (
          <Row className="justify-content-md-center">
            <Col className="col-lg-6">
              <form onSubmit={sendPasswordReset}>
                <SimpleFormInput
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
                  <Button btnClass="primary" type="submit" disabled={!passwordState.isValid}>
                    Reset password
                  </Button>
                </Stack>
              </form>
            </Col>
          </Row>
        )}
      </SimplePageWrapper>
    </>
  );
}
