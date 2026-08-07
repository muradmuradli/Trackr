"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LogInIcon } from "lucide-react";
import { trpc } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

export function AuthLoginForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    const { error } = await authClient.signIn.email({
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <>
      <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="login-email"
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
          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <div className="flex justify-between items-center">
                  <FieldLabel htmlFor="login-password">Password</FieldLabel>
                  <Link
                    className="text-[12px] font-light text-blue-700 hover:underline dark:text-blue-400"
                    href={"/auth/forgot-password"}
                    tabIndex={-1}
                  >
                    Forgot your password?
                  </Link>
                </div>
                <PasswordInput
                  className="py-3"
                  {...field}
                  id="login-password"
                  aria-invalid={fieldState.invalid}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
      </form>
      <div className="my-4">
        <Field orientation="horizontal">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="bg-blue-700 px-3 py-5 w-full text-white hover:bg-blue-600"
            form="login-form"
          >
            {form.formState.isSubmitting ? "Logging in..." : "Log In"}
            <LogInIcon />
          </Button>
        </Field>
      </div>
    </>
  );
}
