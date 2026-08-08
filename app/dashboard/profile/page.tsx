"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import ChangePasswordCard from "@/components/dashboard/change-password-card";
import ProfileAvatar from "@/components/dashboard/profile-avatar";
import StatTile from "@/components/dashboard/stat-tile";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  Activity,
  Briefcase,
  CheckCircle2Icon,
  TrendingUp,
  Users,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const ProfilePage = () => {
  const { data: session, isPending, refetch } = authClient.useSession();
  const { data: stats } = trpc.jobs.stats.useQuery();
  const { data: accounts } = useQuery({
    queryKey: ["listAccounts"],
    queryFn: async () => {
      const { data } = await authClient.listAccounts();
      return data ?? [];
    },
  });

  const [resending, setResending] = useState(false);

  const hasPassword =
    accounts?.some((account) => account.providerId === "credential") ??
    false;

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    values: { name: session?.user.name ?? "" },
  });

  async function onSaveName(data: z.infer<typeof nameSchema>) {
    const { error } = await authClient.updateUser({ name: data.name });

    if (error) {
      toast.error(error.message ?? "Failed to update name.");
      return;
    }

    await refetch();
    toast.success("Name updated successfully!");
  }

  async function handleResendVerification() {
    if (!session?.user.email) return;
    setResending(true);
    const { error } = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: "/dashboard/profile",
    });
    setResending(false);

    if (error) {
      toast.error(error.message ?? "Failed to send verification email.");
      return;
    }

    toast.success("Verification email sent!");
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>

        {isPending || !session ? (
          <div className="mt-6 grid gap-4 lg:gap-6">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:gap-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                <ProfileAvatar
                  name={session.user.name}
                  image={session.user.image}
                />
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-semibold">
                    {session.user.name}
                  </h1>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {session.user.email}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {session.user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2Icon className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <>
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                          Unverified
                        </span>
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          disabled={resending}
                          className="text-xs text-blue-700 hover:underline dark:text-blue-400"
                        >
                          {resending ? "Sending..." : "Resend verification"}
                        </button>
                      </>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Member since{" "}
                      {format(new Date(session.user.createdAt), "MMM yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-semibold">Profile</h2>
              <form
                onSubmit={nameForm.handleSubmit(onSaveName)}
                className="mt-4"
              >
                <FieldGroup>
                  <Controller
                    name="name"
                    control={nameForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="profile-name">
                          Full Name
                        </FieldLabel>
                        <Input
                          className="py-3"
                          {...field}
                          id="profile-name"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
                <Button
                  type="submit"
                  size="sm"
                  disabled={
                    nameForm.formState.isSubmitting ||
                    !nameForm.formState.isDirty
                  }
                  className="mt-4 bg-blue-700 hover:bg-blue-600 text-white"
                >
                  {nameForm.formState.isSubmitting
                    ? "Saving..."
                    : "Save changes"}
                </Button>
              </form>
            </section>

            {hasPassword ? (
              <ChangePasswordCard />
            ) : (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                <h2 className="text-sm font-semibold">Password</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  You signed in with a social account, so there&apos;s no
                  password to manage here.
                </p>
              </section>
            )}

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-semibold">Your Pipeline</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatTile
                  variant="inset"
                  title="Total"
                  content={stats?.total ?? 0}
                  icon={Briefcase}
                />
                <StatTile
                  variant="inset"
                  title="Active"
                  content={stats?.active ?? 0}
                  icon={Activity}
                />
                <StatTile
                  variant="inset"
                  title="Interviewing"
                  content={stats?.interviewing ?? 0}
                  icon={Users}
                />
                <StatTile
                  variant="inset"
                  title="Response Rate"
                  content={stats?.responseRate ?? 0}
                  suffix="%"
                  icon={TrendingUp}
                />
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
