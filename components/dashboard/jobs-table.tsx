"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SOURCE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/application";
import { cn, getInitials } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { format } from "date-fns";
import { LinkIcon, PencilIcon } from "lucide-react";

type Job = RouterOutputs["jobs"]["list"]["items"][number];

const JobsTable = ({ jobs }: { jobs: Job[] }) => {
  if (jobs.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No applications yet — add one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 bg-slate-100 hover:bg-transparent dark:border-slate-800 dark:bg-slate-800/60">
            <TableHead className="pl-4">Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="pr-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="border-slate-100 dark:border-slate-800">
              <TableCell className="pl-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                    {getInitials(job.companyName)}
                  </div>
                  <span className="text-slate-700 dark:text-slate-300">
                    {job.companyName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-slate-700 dark:text-slate-300">
                {job.roleTitle}
              </TableCell>
              <TableCell>
                <Badge
                  className={cn(
                    "border-transparent",
                    STATUS_BADGE_CLASSES[job.status],
                  )}
                >
                  {STATUS_LABELS[job.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400">
                {format(new Date(job.date), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-slate-500 dark:text-slate-400">
                {SOURCE_LABELS[job.source]}
              </TableCell>
              <TableCell className="pr-4">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit application"
                  >
                    <PencilIcon className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Open job link"
                  >
                    <LinkIcon className="size-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobsTable;
