"use client";

import { useDraggable } from "@dnd-kit/core";
import Link from "next/link";
import { SOURCE_LABELS } from "@/lib/application";
import { cn, getInitials } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { format } from "date-fns";

type Job = RouterOutputs["jobs"]["board"][number];

export function BoardCardInfo({ job }: { job: Job }) {
  return (
    <>
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
          {getInitials(job.companyName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
            {job.companyName}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {job.roleTitle}
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <span>{format(new Date(job.date), "MMM d")}</span>
        <span>{SOURCE_LABELS[job.source]}</span>
      </div>
    </>
  );
}

export function BoardCardContent({
  job,
  dragging = false,
}: {
  job: Job;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none",
        dragging && "shadow-lg",
      )}
    >
      <BoardCardInfo job={job} />
    </div>
  );
}

const BoardCard = ({ job }: { job: Job }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: job.id,
  });

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "block cursor-grab touch-none active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <BoardCardContent job={job} />
    </Link>
  );
};

export default BoardCard;
