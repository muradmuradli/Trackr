import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthForgotPasswordForm from "@/components/auth/auth-forgot-password-form";

const ForgotPasswordPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return <AuthForgotPasswordForm />;
};

export default ForgotPasswordPage;
