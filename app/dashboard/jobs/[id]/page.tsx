"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import JobDocuments from "@/components/dashboard/job-documents";
import JobFormDialog from "@/components/dashboard/job-form-dialog";
import JobStatusTimeline from "@/components/dashboard/job-status-timeline";
import {
  SOURCE_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from "@/lib/application";
import { cn, getInitials, trpc } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeftIcon,
  CheckIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm break-words text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return "Not specified";
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
  return `$${(min ?? max)!.toLocaleString()}`;
}

const JobDetailsPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const utils = trpc.useUtils();

  const {
    data: job,
    isPending,
    error,
  } = trpc.jobs.getById.useQuery({ id: params.id });

  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [syncedNotes, setSyncedNotes] = useState<{
    id: string;
    notes: string;
  } | null>(null);
  if (
    job &&
    (syncedNotes?.id !== job.id || syncedNotes?.notes !== (job.notes ?? ""))
  ) {
    setSyncedNotes({ id: job.id, notes: job.notes ?? "" });
    setNotes(job.notes ?? "");
  }

  const saveNotesMutation = trpc.jobs.update.useMutation({
    onSuccess: (updatedJob) => {
      utils.jobs.getById.setData({ id: updatedJob.id }, updatedJob);
      utils.jobs.list.invalidate();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    },
    onError: () => {
      toast.error("Failed to save notes. Please try again.");
    },
  });

  const deleteMutation = trpc.jobs.delete.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate();
      utils.jobs.stats.invalidate();
      toast.success("Job deleted successfully!");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Failed to delete job. Please try again.");
    },
  });

  function saveNotes() {
    if (!job) return;
    saveNotesMutation.mutate({
      id: job.id,
      companyName: job.companyName,
      roleTitle: job.roleTitle,
      jobUrl: job.jobUrl ?? "",
      status: job.status,
      date: new Date(job.date),
      source: job.source,
      salaryMin: job.salaryMin ?? undefined,
      salaryMax: job.salaryMax ?? undefined,
      notes,
    });
  }

  let content: React.ReactNode;

  if (isPending) {
    content = (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Skeleton className="h-4 w-32" />
        <div className="mt-5 flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="grid gap-4 lg:gap-6">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </main>
    );
  } else if (error || !job) {
    content = (
      <main className="mx-auto grid max-w-2xl place-items-center gap-3 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold">Job not found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          It may have been removed from your pipeline.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  } else {
    content = (
      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>

        <header className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              {getInitials(job.companyName)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold sm:text-2xl">
                {job.companyName}
              </h1>
              <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                {job.roleTitle}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              className={cn(
                "border-transparent",
                STATUS_BADGE_CLASSES[job.status],
              )}
            >
              {STATUS_LABELS[job.status]}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove{" "}
                    <strong>{job.roleTitle}</strong> at{" "}
                    <strong>{job.companyName}</strong> from your pipeline.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive! text-white! hover:bg-destructive/90!"
                    onClick={() => deleteMutation.mutate({ id: job.id })}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="grid gap-4 lg:gap-6">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-semibold">Overview</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Status">
                  <Badge
                    className={cn(
                      "border-transparent",
                      STATUS_BADGE_CLASSES[job.status],
                    )}
                  >
                    {STATUS_LABELS[job.status]}
                  </Badge>
                </Field>
                <Field label="Applied date">
                  {format(new Date(job.date), "MMM d, yyyy")}
                </Field>
                <Field label="Source">{SOURCE_LABELS[job.source]}</Field>
                <Field label="Salary range">
                  {formatSalary(job.salaryMin, job.salaryMax)}
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Job URL">
                    {job.jobUrl ? (
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-700 hover:underline dark:text-blue-400"
                      >
                        <span className="truncate">{job.jobUrl}</span>
                        <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
              <h2 className="text-sm font-semibold">Notes</h2>
              <Textarea
                rows={6}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Interview prep, recruiter contacts, follow-up dates…"
                className="mt-3 resize-y"
              />
              <div className="mt-3 flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={saveNotes}
                  disabled={
                    notes === (job.notes ?? "") || saveNotesMutation.isPending
                  }
                  className="bg-blue-700 hover:bg-blue-600 text-white"
                >
                  {saveNotesMutation.isPending ? "Saving..." : "Save notes"}
                </Button>
                {saved && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <CheckIcon className="h-3.5 w-3.5" /> Saved
                  </span>
                )}
              </div>
            </section>

            <JobDocuments jobId={job.id} />
          </div>

          <JobStatusTimeline jobId={job.id} />
        </div>

        <JobFormDialog open={editOpen} onOpenChange={setEditOpen} job={job} />
      </main>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      {content}
    </div>
  );
};

export default JobDetailsPage;
