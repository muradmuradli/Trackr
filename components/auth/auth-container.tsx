"use client";

import { GitHubIcon, GoogleIcon } from "@/lib/oauth_icons";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../ui/button";
import { AuthLoginForm } from "./auth-login-form";
import { AuthSignupForm } from "./auth-signup-form";
import AuthTabs from "./auth-tabs";

import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const AuthContainer = () => {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const justVerified = searchParams.get("verified") === "true";
  const passwordReset = searchParams.get("reset") === "true";

  const [isLogin, setIsLogin] = useState(mode === "login");

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard", // where to land after successful auth
    });
  };

  return (
    <div className="bg-card p-6 rounded-2xl w-full max-w-md h-fit shadow-xl border border-border">
      {justVerified && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4 text-center dark:bg-green-500/10 dark:text-green-400">
          Email verified! You can now log in.
        </div>
      )}
      {passwordReset && (
        <div className="bg-green-50 text-green-700 text-sm rounded-lg px-3 py-2 mb-4 text-center dark:bg-green-500/10 dark:text-green-400">
          Password reset! You can now log in.
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? "login" : "signup"}
          initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
          transition={{ duration: 0.15 }}
        >
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-semibold text-foreground">
              {isLogin ? "Welcome Back" : "Create your account"}
            </h1>
            <span className="text-muted-foreground font-light text-[14px]">
              {isLogin
                ? "Log in to keep track of your applications"
                : "Start tracking your applications in seconds"}
            </span>
          </div>

          <AuthTabs isLogin={isLogin} setIsLogin={setIsLogin} />

          {isLogin ? <AuthLoginForm /> : <AuthSignupForm />}

          <div className="flex items-center gap-2 justify-center">
            <div className="border-b border-border w-3/12"></div>
            <span className="uppercase text-xs text-muted-foreground">
              or continue with
            </span>
            <div className="border-b border-border w-3/12"></div>
          </div>

          <div className="flex gap-2 my-3">
            <Button
              variant="outline"
              className="w-6/12 px-2 py-4 rounded-lg text-sm flex items-center"
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon className="h-4 w-4" />
              Google
            </Button>

            <Button
              variant="outline"
              className="w-6/12 px-2 py-4 rounded-lg text-sm flex items-center"
              onClick={() => console.log("github")}
            >
              <GitHubIcon className="h-4 w-4" />
              GitHub
            </Button>
          </div>

          <div className="text-center text-[14px] text-muted-foreground font-light">
            {isLogin ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-blue-700 hover:underline cursor-pointer dark:text-blue-400"
                  onClick={() => setIsLogin(false)}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-700 hover:underline cursor-pointer dark:text-blue-400"
                  onClick={() => setIsLogin(true)}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AuthContainer;
