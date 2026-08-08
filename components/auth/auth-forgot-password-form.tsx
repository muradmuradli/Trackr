"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailIcon, MoveLeft, SendIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const forgotPasswordSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
});

const AuthForgotPasswordForm = () => {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: z.infer<typeof forgotPasswordSchema>) {
    setServerError(null);

    const { error } = await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: "/reset-password",
    });

    if (error) {
      setServerError(
        error.message ?? "Something went wrong. Please try again.",
      );
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl shadow-slate-300 flex flex-col items-center gap-3 text-center dark:bg-slate-900 dark:shadow-none">
        {status === "sent" ? (
          <>
            <div className="bg-blue-50 p-3 rounded-full dark:bg-blue-500/10">
              <MailIcon className="text-blue-700 h-6 w-6 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-semibold">Check your inbox</h1>
            <p className="text-slate-500 text-sm dark:text-slate-400">
              If an account exists for{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {form.getValues("email")}
              </strong>
              , we&apos;ve sent a link to reset your password.
            </p>
            <p className="text-slate-400 text-xs dark:text-slate-500">
              Didn&apos;t see it? Check your spam folder — the link expires in
              1 hour.
            </p>
            <p className="text-slate-400 text-xs dark:text-slate-500">
              Signed up with Google? The link will let you add a password —
              or you can just continue signing in with Google.
            </p>
            <Button
              variant="outline"
              className="w-full mt-2"
              onClick={() => setStatus("idle")}
            >
              Try a different email
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Forgot your password?</h1>
            <p className="text-slate-500 text-sm mb-2 dark:text-slate-400">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>

            <form
              id="forgot-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full"
            >
              <FieldGroup>
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="forgot-password-email">
                        Email
                      </FieldLabel>
                      <Input
                        className="py-3"
                        {...field}
                        id="forgot-password-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              {serverError && (
                <p className="text-red-600 text-sm mt-3 dark:text-red-400">
                  {serverError}
                </p>
              )}

              <div className="mt-4">
                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-blue-700 px-3 py-5 w-full text-white hover:bg-blue-600"
                    form="forgot-password-form"
                  >
                    {form.formState.isSubmitting
                      ? "Sending..."
                      : "Send reset link"}
                    <SendIcon />
                  </Button>
                </Field>
              </div>
            </form>
          </>
        )}
      </div>

      <a
        href="/auth"
        className="text-slate-500 flex items-center gap-2 mt-4 text-sm font-light hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300"
      >
        <MoveLeft size={14} />
        Back to login
      </a>
    </div>
  );
};

export default AuthForgotPasswordForm;
