"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

const VerifyEmail = () => {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [cooldown, setCooldown] = useState(0);

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    setStatus("sending");
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/auth?mode=login&verified=true",
    });
    setStatus(error ? "idle" : "sent");

    if (!error) {
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl shadow-slate-300 flex flex-col items-center gap-3 text-center dark:bg-slate-900 dark:shadow-none">
        <div className="bg-blue-50 p-3 rounded-full dark:bg-blue-500/10">
          <MailIcon className="text-blue-700 h-6 w-6 dark:text-blue-400" />
        </div>

        <h1 className="text-xl font-semibold">Check your inbox</h1>

        <p className="text-slate-500 text-sm dark:text-slate-400">
          We sent a verification link to{" "}
          <strong className="text-slate-700 dark:text-slate-300">
            {email}
          </strong>
          . Click it to activate your account.
        </p>

        <p className="text-slate-400 text-xs dark:text-slate-500">
          Didn&apos;t see it? Check your spam folder — the link expires in 1
          hour.
        </p>

        <Button
          onClick={handleResend}
          disabled={status === "sending" || cooldown > 0}
          variant="outline"
          className="bg-blue-700 px-3 py-5 w-full hover:bg-blue-600 text-white hover:text-white"
        >
          {status === "sending"
            ? "Sending..."
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : status === "sent"
                ? "Sent! Resend again"
                : "Resend email"}
        </Button>

        <a
          href="/auth"
          className="text-blue-700 text-xs hover:underline cursor-pointer text-center text-[14px] font-light dark:text-blue-400"
        >
          Wrong email? Go back
        </a>
      </div>
    </div>
  );
};

const VerifyEmailPage = () => (
  <Suspense>
    <VerifyEmail />
  </Suspense>
);

export default VerifyEmailPage;
