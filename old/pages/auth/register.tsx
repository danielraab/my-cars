import SimplePageWrapper from "../../components/SimplePageWrapper";
import RegisterForm from "../../components/user/RegisterForm";

export default function RegisterPage() {
  return (
    <>
      <SimplePageWrapper title="Register new user">
        <RegisterForm />
      </SimplePageWrapper>
    </>
  );
}
