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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  STATUS_OPTIONS,
  type ApplicationStatus,
} from "@/lib/application";
import { cn, getInitials, trpc } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { format } from "date-fns";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Job = RouterOutputs["jobs"]["list"]["items"][number];
type JobList = RouterOutputs["jobs"]["list"];

const JobsTable = ({ jobs }: { jobs: Job[] }) => {
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();

  // Keep selection scoped to whatever is actually visible — prunes stale ids
  // after pagination/filter changes or a bulk/optimistic mutation removes rows.
  const visibleIds = new Set(jobs.map((job) => job.id));
  const prunedSelection = [...selectedIds].filter((id) => visibleIds.has(id));
  if (prunedSelection.length !== selectedIds.size) {
    setSelectedIds(new Set(prunedSelection));
  }

  const deleteMutation = trpc.jobs.delete.useMutation({
    onMutate: async ({ id }) => {
      const listKey = getQueryKey(trpc.jobs.list);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousQueries = queryClient.getQueriesData({
        queryKey: listKey,
      });

      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: JobList | undefined) => {
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
      utils.jobs.stats.invalidate();
      toast.success("Job deleted successfully!");
    },
  });

  const bulkDeleteMutation = trpc.jobs.bulkDelete.useMutation({
    onMutate: async ({ ids }) => {
      const listKey = getQueryKey(trpc.jobs.list);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousQueries = queryClient.getQueriesData({
        queryKey: listKey,
      });
      const idSet = new Set(ids);

      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: JobList | undefined) => {
          if (!old) return old;
          const total = Math.max(0, old.total - ids.length);
          return {
            ...old,
            items: old.items.filter((item) => !idSet.has(item.id)),
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
      toast.error("Failed to delete selected jobs. Please try again.");
    },
    onSuccess: (result) => {
      utils.jobs.stats.invalidate();
      setSelectedIds(new Set());
      toast.success(
        `${result.deletedIds.length} job${result.deletedIds.length === 1 ? "" : "s"} deleted successfully!`,
      );
    },
  });

  const bulkUpdateStatusMutation = trpc.jobs.bulkUpdateStatus.useMutation({
    onMutate: async ({ ids, status }) => {
      const listKey = getQueryKey(trpc.jobs.list);
      await queryClient.cancelQueries({ queryKey: listKey });

      const previousQueries = queryClient.getQueriesData({
        queryKey: listKey,
      });
      const idSet = new Set(ids);

      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: JobList | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              idSet.has(item.id) ? { ...item, status } : item,
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Failed to update selected jobs. Please try again.");
    },
    onSuccess: (result) => {
      utils.jobs.stats.invalidate();
      setSelectedIds(new Set());
      toast.success(
        `${result.updatedIds.length} job${result.updatedIds.length === 1 ? "" : "s"} updated successfully!`,
      );
    },
  });

  function toggleSelected(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(jobs.map((job) => job.id)) : new Set());
  }

  if (jobs.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No jobs yet — add one to get started.
        </p>
      </div>
    );
  }

  const allSelected = selectedIds.size > 0 && selectedIds.size === jobs.length;

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-blue-50 px-4 py-2 dark:border-slate-800 dark:bg-blue-500/10">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(status) =>
                  bulkUpdateStatusMutation.mutate({
                    ids: [...selectedIds],
                    status: status as ApplicationStatus,
                  })
                }
              >
                <SelectTrigger
                  size="sm"
                  className="h-8 w-40 bg-white dark:bg-slate-900"
                >
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2Icon className="size-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete {selectedIds.size} job
                      {selectedIds.size === 1 ? "" : "s"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove the selected jobs from your
                      pipeline. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive! text-white! hover:bg-destructive/90!"
                      onClick={() =>
                        bulkDeleteMutation.mutate({ ids: [...selectedIds] })
                      }
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="border-slate-200 bg-slate-100 hover:bg-transparent dark:border-slate-800 dark:bg-slate-800/60">
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) =>
                    toggleSelectAll(checked === true)
                  }
                  aria-label="Select all jobs on this page"
                />
              </TableHead>
              <TableHead>Company</TableHead>
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
                data-state={selectedIds.has(job.id) ? "selected" : undefined}
                className="border-slate-100 dark:border-slate-800"
              >
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedIds.has(job.id)}
                    onCheckedChange={(checked) =>
                      toggleSelected(job.id, checked === true)
                    }
                    aria-label={`Select ${job.roleTitle} at ${job.companyName}`}
                  />
                </TableCell>
                <TableCell>
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
                      aria-label="View job details"
                      asChild
                    >
                      <Link href={`/dashboard/jobs/${job.id}`}>
                        <EyeIcon className="size-3.5" />
                      </Link>
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
                            className="bg-destructive! text-white! hover:bg-destructive/90!"
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
