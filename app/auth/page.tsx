import AuthContainer from "@/components/auth/auth-container";
import Logo from "@/components/logo";
import { Suspense } from "react";

const Auth = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-screen bg-linear-to-r from-slate-100 to-slate-200">
      <Logo />
      <Suspense>
        <AuthContainer />
      </Suspense>
    </div>
  );
};

export default Auth;
