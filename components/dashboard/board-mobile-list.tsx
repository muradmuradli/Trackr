"use client";

import Link from "next/link";
import { BoardCardInfo } from "@/components/dashboard/board-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  STATUS_DOT_CLASSES,
  STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/application";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/types";

type Job = RouterOutputs["jobs"]["board"][number];

const BoardMobileList = ({
  jobsByStatus,
  onStatusChange,
}: {
  jobsByStatus: Map<ApplicationStatus, Job[]>;
  onStatusChange: (job: Job, status: ApplicationStatus) => void;
}) => {
  return (
    <div className="mt-6 flex flex-col gap-6 sm:hidden">
      {STATUS_OPTIONS.map((option) => {
        const jobs = jobsByStatus.get(option.value) ?? [];
        return (
          <div key={option.value}>
            <div className="flex items-center gap-2 px-1">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  STATUS_DOT_CLASSES[option.value],
                )}
              />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {option.label}
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {jobs.length}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                >
                  <Link href={`/dashboard/jobs/${job.id}`} className="block">
                    <BoardCardInfo job={job} />
                  </Link>
                  <Select
                    value={job.status}
                    onValueChange={(value) =>
                      onStatusChange(job, value as ApplicationStatus)
                    }
                  >
                    <SelectTrigger size="sm" className="mt-3 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((statusOption) => (
                        <SelectItem
                          key={statusOption.value}
                          value={statusOption.value}
                        >
                          {statusOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
              {jobs.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-600">
                  No jobs
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BoardMobileList;
