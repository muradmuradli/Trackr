import AuthContainer from "@/components/auth/auth-container";
import DemoLoginPanel from "@/components/auth/demo-login-panel";
import Logo from "@/components/logo";
import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

const Auth = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <Link href="/">
        <Logo />
      </Link>
      <Suspense>
        <AuthContainer />
      </Suspense>

      <DemoLoginPanel />

      <Link
        href="/"
        className="text-blue-700 text-xs hover:underline cursor-pointer text-center text-[14px] font-light dark:text-blue-400"
      >
        Back to home
      </Link>
    </div>
  );
};

export default Auth;
