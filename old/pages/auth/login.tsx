import SimplePageWrapper from "../../components/SimplePageWrapper";
import LoginForm from "../../components/user/LoginForm";

export default function handle() {
  return (
    <>
      <SimplePageWrapper title="Login">
        <LoginForm />
      </SimplePageWrapper>
    </>
  );
}
