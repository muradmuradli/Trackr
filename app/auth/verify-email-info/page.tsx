import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AuthVerifyEmailForm from "@/components/auth/auth-verify-email-form";

const VerifyEmailInfoPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  // Only bounce away once the account is actually verified — better-auth can
  // issue a session right after sign-up, before the user has clicked the
  // verification link, and that in-between state is exactly what this page
  // is for.
  if (session?.user.emailVerified) {
    redirect("/dashboard");
  }

  return <AuthVerifyEmailForm />;
};

export default VerifyEmailInfoPage;
