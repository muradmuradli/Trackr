"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Please enter your full name"),
    email: z.email({ message: "Invalid email address" }),
    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { UserPlus } from "lucide-react";

export function AuthSignupForm() {
  const router = useRouter();

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof signupSchema>) {
    const { error } = await authClient.signUp.email({
      name: data.fullName,
      email: data.email,
      password: data.password,
    });

    if (error) {
      console.error(error.message);
      return;
    }

    router.replace(
      `auth/verify-email-info?email=${encodeURIComponent(data.email)}`,
    );
  }

  return (
    <>
      <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)}>
        <FieldGroup>
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-fullname">Full Name</FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="signup-fullname"
                  aria-invalid={fieldState.invalid}
                  placeholder="John Doe"
                  autoComplete="name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="signup-email"
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
                <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="signup-password"
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
                <FieldLabel htmlFor="signup-confirm-password">
                  Confirm Password
                </FieldLabel>
                <Input
                  className="py-3"
                  {...field}
                  id="signup-confirm-password"
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
      </form>
      <div className="my-4">
        <Field orientation="horizontal">
          <Button
            disabled={form.formState.isSubmitting}
            type="submit"
            className="bg-blue-700 px-3 py-5 w-full hover:bg-blue-600"
            form="signup-form"
          >
            {form.formState.isSubmitting ? "Signing up..." : "Sign Up"}
            <UserPlus />
          </Button>
        </Field>
      </div>
    </>
  );
}
