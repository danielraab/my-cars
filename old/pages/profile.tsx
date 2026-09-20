import moment from "moment";
import { useEffect, useState } from "react";
import SimplePageWrapper from "../components/SimplePageWrapper";
import UserForm from "../components/user/UserForm";
import { Col } from "../components/utilities/layout/Container";
import useAuth from "../hooks/use-auth";
import { TokenInfo } from "../lib/types/user";
import { getTokenInfo } from "../lib/frontend/userService";
import { typedKeys } from "../lib/general";

export default function Profile() {
  const { currentAuth } = useAuth({ redirectTo: "/auth/login" });
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  useEffect(() => {
    getTokenInfo().then((tokenInfo) => {
      setTokenInfo(tokenInfo);
    });
  }, []);
  const tokenParamList: any = [];

  typedKeys(tokenInfo || {}).forEach((key) => {
    let value: string = tokenInfo![key];
    if (key === "iat" || key === "exp") {
      value = moment.unix(parseInt(value)).format("dd D. MMM YYYY, HH:mm:ss");
    }

    tokenParamList.push(
      <div key={key}>
        <span className="d-inline-block w-25">{key}:</span>
        <span>{value}</span>
      </div>
    );
  });

  return (
    <SimplePageWrapper title="Profile">
      <Col className="col-12 col-lg-6 mt-lg-0">
        <h3>User information:</h3>
        <UserForm />
      </Col>
      <Col className="col-12 col-lg-6 mt-lg-0 mt-lg-0 mt-4">
        <h3>Token info:</h3>
        {tokenParamList}
      </Col>
    </SimplePageWrapper>
  );
}
