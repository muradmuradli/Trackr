"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import ApplicationsOverTimeChart from "@/components/dashboard/applications-over-time-chart";
import FunnelChart from "@/components/dashboard/funnel-chart";
import StatusDistributionChart from "@/components/dashboard/status-distribution-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/utils";

const AnalyticsPage = () => {
  const { data, isPending } = trpc.jobs.analytics.useQuery();

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Pipeline Analytics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Trends and outcomes across everything you&apos;ve tracked.
          </p>
        </div>

        {isPending || !data ? (
          <div className="mt-6 flex flex-col gap-4">
            <Skeleton className="h-80 rounded-lg" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-72 rounded-lg" />
              <Skeleton className="h-72 rounded-lg" />
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            <ApplicationsOverTimeChart data={data.byMonth} />
            <div className="grid gap-4 sm:grid-cols-2">
              <FunnelChart data={data.funnel} />
              <StatusDistributionChart data={data.distribution} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPage;
