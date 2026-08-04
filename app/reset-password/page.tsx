"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { KeyRoundIcon, MoveLeft, TriangleAlertIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");

  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof resetPasswordSchema>) {
    setServerError(null);

    const { error } = await authClient.resetPassword({
      newPassword: data.password,
      token: token ?? undefined,
    });

    if (error) {
      setServerError(
        error.message ?? "Something went wrong. Please try again.",
      );
      return;
    }

    router.push("/auth?reset=true");
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-linear-to-r from-slate-100 to-slate-200">
      <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-xl shadow-slate-300 flex flex-col items-center gap-3 text-center">
        {!token || tokenError ? (
          <>
            <div className="bg-red-50 p-3 rounded-full">
              <TriangleAlertIcon className="text-red-600 h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold">Link expired</h1>
            <p className="text-slate-500 text-sm">
              This password reset link is invalid or has expired. Request a
              new one to continue.
            </p>
            <Button
              className="bg-blue-700 px-3 py-5 w-full hover:bg-blue-600 mt-2"
              onClick={() => router.push("/auth/forgot-password")}
            >
              Request a new link
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold">Set a new password</h1>
            <p className="text-slate-500 text-sm mb-2">
              Choose a new password for your account.
            </p>

            <form
              id="reset-password-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full"
            >
              <FieldGroup>
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="reset-password-password">
                        New Password
                      </FieldLabel>
                      <Input
                        className="py-3"
                        {...field}
                        id="reset-password-password"
                        aria-invalid={fieldState.invalid}
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="reset-password-confirm-password">
                        Confirm Password
                      </FieldLabel>
                      <Input
                        className="py-3"
                        {...field}
                        id="reset-password-confirm-password"
                        aria-invalid={fieldState.invalid}
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              {serverError && (
                <p className="text-red-600 text-sm mt-3">{serverError}</p>
              )}

              <div className="mt-4">
                <Field orientation="horizontal">
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-blue-700 px-3 py-5 w-full hover:bg-blue-600"
                    form="reset-password-form"
                  >
                    {form.formState.isSubmitting
                      ? "Saving..."
                      : "Reset password"}
                    <KeyRoundIcon />
                  </Button>
                </Field>
              </div>
            </form>
          </>
        )}
      </div>

      <a
        href="/auth"
        className="text-slate-500 flex items-center gap-2 mt-4 text-sm font-light hover:text-slate-600"
      >
        <MoveLeft size={14} />
        Back to login
      </a>
    </div>
  );
};

const ResetPasswordPage = () => (
  <Suspense>
    <ResetPassword />
  </Suspense>
);

export default ResetPasswordPage;
