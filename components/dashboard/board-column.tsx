"use client";

import { useDroppable } from "@dnd-kit/core";
import BoardCard from "@/components/dashboard/board-card";
import {
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/application";
import { cn } from "@/lib/utils";
import type { RouterOutputs } from "@/types";

type Job = RouterOutputs["jobs"]["board"][number];

const BoardColumn = ({
  status,
  jobs,
}: {
  status: ApplicationStatus;
  jobs: Job[];
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-slate-100 dark:bg-slate-900/60">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn("h-2 w-2 rounded-full", STATUS_DOT_CLASSES[status])}
          />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {STATUS_LABELS[status]}
          </h2>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {jobs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-b-xl px-3 pb-3 transition-colors",
          isOver && "bg-blue-100/60 dark:bg-blue-500/10",
        )}
      >
        {jobs.map((job) => (
          <BoardCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-600">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardColumn;
