"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/application";
import { cn, trpc } from "@/lib/utils";
import { format } from "date-fns";

const JobStatusTimeline = ({ jobId }: { jobId: string }) => {
  const { data: events, isPending } = trpc.jobs.getTimeline.useQuery({
    jobId,
  });

  return (
    <section className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <h2 className="text-sm font-semibold">Status History</h2>

      {isPending ? (
        <div className="mt-4 grid gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !events || events.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No status changes recorded yet.
        </p>
      ) : (
        <ol className="mt-4 grid gap-5">
          {events.map((event, i) => (
            <li
              key={event.id}
              className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-3"
            >
              {i < events.length - 1 && (
                <span className="absolute top-5 left-[5px] h-full w-px bg-slate-200 dark:bg-slate-800" />
              )}
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-700 dark:bg-blue-400" />
              <div className="min-w-0">
                <Badge
                  className={cn(
                    "border-transparent",
                    STATUS_BADGE_CLASSES[event.status],
                  )}
                >
                  {STATUS_LABELS[event.status]}
                </Badge>
                <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                  {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};

export default JobStatusTimeline;
