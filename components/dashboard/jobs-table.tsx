"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JobFormDialog from "@/components/dashboard/job-form-dialog";
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
import { cn, getInitials, trpc } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { format } from "date-fns";
import { LinkIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

type Job = RouterOutputs["jobs"]["list"]["items"][number];

const JobsTable = ({ jobs }: { jobs: Job[] }) => {
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  const deleteMutation = trpc.jobs.delete.useMutation({
    onMutate: async ({ id }) => {
      const listKey = getQueryKey(trpc.jobs.list);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousQueries = queryClient.getQueriesData({
        queryKey: listKey,
      });

      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: RouterOutputs["jobs"]["list"] | undefined) => {
          if (!old) return old;
          const total = Math.max(0, old.total - 1);
          return {
            ...old,
            items: old.items.filter((item) => item.id !== id),
            total,
            totalPages: Math.max(1, Math.ceil(total / old.pageSize)),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to delete job. Please try again.");
    },
    onSuccess: () => {
      // The optimistic removal already reflects the final state — just quietly
      // resync stats in the background, no jobs.list invalidate/refetch (that would
      // flash a loading skeleton over a table that's already correct).
      utils.jobs.stats.invalidate();
      toast.success("Job deleted successfully!");
    },
  });

  if (jobs.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No jobs yet — add one to get started.
        </p>
      </div>
    );
  }

  return (
    <>
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
              <TableRow
                key={job.id}
                className="border-slate-100 dark:border-slate-800"
              >
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
                      aria-label="Edit job"
                      onClick={() => setEditingJob(job)}
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
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete job"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove{" "}
                            <strong>{job.roleTitle}</strong> at{" "}
                            <strong>{job.companyName}</strong> from your
                            pipeline. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 text-white! hover:bg-red-500!"
                            onClick={() =>
                              deleteMutation.mutate({ id: job.id })
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <JobFormDialog
        open={!!editingJob}
        onOpenChange={(open) => !open && setEditingJob(null)}
        job={editingJob ?? undefined}
      />
    </>
  );
};

export default JobsTable;
