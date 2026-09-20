import Link from "next/link";
import SimplePageWrapper from "../../components/SimplePageWrapper";
import Button from "../../components/utilities/form/Button";
import SimpleFormInput from "../../components/utilities/form/Input";
import Stack from "../../components/utilities/helper/Stack";
import { Col, Row } from "../../components/utilities/layout/Container";
import useToast from "../../hooks/use-toast";
import useValidatedInput from "../../hooks/form/use-validated-input";
import { ToastData } from "../../lib/frontend/toastData";
import { jsonFetch } from "../../lib/frontend/customFetches";
import { isEmailValid } from "../../lib/validation";

export default function PasswordForgotten() {
  const addToast = useToast();
  const emailState = useValidatedInput("", { validation: isEmailValid });

  const sendPasswordForgotten = (event: React.FormEvent) => {
    event.preventDefault();

    if (emailState.isValid) {
      jsonFetch(
        "POST",
        process.env.NEXT_PUBLIC_APP_BACKEND_URL,
        "/api/v1/auth/requestPasswordResetLink",
        undefined,
        undefined,
        {
          email: emailState.htmlElement.value,
        }
      )
        .then((data) => {
          if (data.status === 200) {
            emailState.clear();
            addToast(new ToastData("Password reset link", "Password reset link was sent via mail.", "success"));
          } else
            addToast(
              new ToastData("Error resetting password", "Error while requesting reset password link.", "danger")
            );
        })
        .catch(() => {
          addToast(new ToastData("Error resetting password", "Error while requesting reset password link.", "danger"));
        });
    } else {
      emailState.setIsTouched(true);
    }
  };

  return (
    <SimplePageWrapper title="Password forgotten ?">
      <Row className="justify-content-md-center">
        <Col className="col-lg-6">
          <form onSubmit={sendPasswordForgotten}>
            <SimpleFormInput
              label="eMail"
              controlProps={{
                type: "text",
                ...emailState.htmlElement,
              }}
              validation={{
                negativeFeedback: "Enter valid existing mail address.",
                ...emailState.validation,
              }}
            />
            <Stack horizontal>
              <Button btnClass="primary" type="submit" disabled={!emailState.isValid}>
                Send reset link
              </Button>
              <Link href="/auth/register" className="link-primary ms-auto">
                or register now
              </Link>
            </Stack>
          </form>
        </Col>
      </Row>
    </SimplePageWrapper>
  );
}
