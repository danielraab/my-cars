import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import SimplePageWrapper from "../../../components/SimplePageWrapper";
import Alert from "../../../components/utilities/helper/Alert";
import { Variants } from "../../../lib/frontend/bootstrap.t";
import { jsonFetch } from "../../../lib/frontend/customFetches";

type VerificationState = {
  status: Variants;
  message: string;
};

export default function MailVerification() {
  const router = useRouter();

  const [verification, setVerification] = useState<VerificationState>({
    status: "primary",
    message: "Please wait for the verification...",
  });

  useEffect(() => {
    const [userId, specialToken] = (router.query.params as string[]) || [];

    if (userId && specialToken) {
      setVerification({ status: "primary", message: "Please wait for the verification..." });
      jsonFetch("POST", process.env.NEXT_PUBLIC_APP_BACKEND_URL, "/api/v1/auth/verifyMail", undefined, undefined, {
        userId,
        specialToken,
      })
        .then((data) => {
          if (data.status === 200) {
            setVerification({ status: "success", message: "The mail was successfully verified." });
          } else {
            setVerification({ status: "danger", message: "Not able to verify the mail: " + data.body.message });
          }
        })
        .catch((err) => {
          console.error("error fetching mailVerify", err);
          setVerification({ status: "danger", message: "Unknown error while Server was verifing your mail." });
        });
    } else {
      setVerification({
        status: "danger",
        message: "Some parameter are missing. Please copy the link in your mail again or try to reset your password.",
      });
    }
  }, [router.query]);

  return (
    <>
      <SimplePageWrapper title="Verification:">
        <Alert variant={verification.status}>{verification.message}</Alert>
      </SimplePageWrapper>
    </>
  );
}
