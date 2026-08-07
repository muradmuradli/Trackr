"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import Link from "next/link";
import { BoardCardContent } from "@/components/dashboard/board-card";
import BoardColumn from "@/components/dashboard/board-column";
import BoardMobileList from "@/components/dashboard/board-mobile-list";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_OPTIONS, type ApplicationStatus } from "@/lib/application";
import { trpc } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

type Job = RouterOutputs["jobs"]["board"][number];
type JobList = RouterOutputs["jobs"]["list"];

const BoardPage = () => {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const { data: jobs, isPending } = trpc.jobs.board.useQuery();
  const [activeJob, setActiveJob] = useState<Job | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const updateStatusMutation = trpc.jobs.update.useMutation({
    onError: () => {
      toast.error("Failed to update job status. Please try again.");
    },
    onSuccess: (updatedJob) => {
      const boardKey = getQueryKey(trpc.jobs.board);
      queryClient.setQueriesData<Job[]>({ queryKey: boardKey }, (old) =>
        old?.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
      );

      const listKey = getQueryKey(trpc.jobs.list);
      queryClient.setQueriesData(
        { queryKey: listKey },
        (old: JobList | undefined) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              item.id === updatedJob.id ? updatedJob : item,
            ),
          };
        },
      );
      utils.jobs.getById.setData({ id: updatedJob.id }, updatedJob);
      utils.jobs.stats.invalidate();
      utils.jobs.getTimeline.invalidate({ jobId: updatedJob.id });
    },
  });

  // Shared by drag-and-drop (desktop/tablet) and the status <Select> (mobile,
  // where dragging a card to an off-screen column isn't a workable gesture).
  function changeStatus(job: Job, newStatus: ApplicationStatus) {
    if (job.status === newStatus) return;

    const boardKey = getQueryKey(trpc.jobs.board);
    const previousQueries = queryClient.getQueriesData<Job[]>({
      queryKey: boardKey,
    });

    queryClient.setQueriesData<Job[]>({ queryKey: boardKey }, (old) => {
      if (!old) return old;
      const found = old.find((j) => j.id === job.id);
      if (!found) return old;
      return [
        ...old.filter((j) => j.id !== job.id),
        { ...found, status: newStatus },
      ];
    });

    updateStatusMutation.mutate(
      {
        id: job.id,
        companyName: job.companyName,
        roleTitle: job.roleTitle,
        jobUrl: job.jobUrl ?? "",
        status: newStatus,
        date: new Date(job.date),
        source: job.source,
        salaryMin: job.salaryMin ?? undefined,
        salaryMax: job.salaryMax ?? undefined,
        notes: job.notes ?? "",
      },
      {
        onError: () => {
          previousQueries.forEach(([key, data]) => {
            queryClient.setQueryData(key, data);
          });
        },
      },
    );
  }

  function handleDragStart(event: DragStartEvent) {
    const job = jobs?.find((j) => j.id === event.active.id);
    setActiveJob(job ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const job = jobs?.find((j) => j.id === active.id);
    const newStatus = over?.id as ApplicationStatus | undefined;

    // Both this and changeStatus's cache patch run synchronously in the same
    // handler, so React batches them into one render: the drag overlay
    // disappears and the card is already showing in its new column, with no
    // frame in between where it's back in the old one.
    setActiveJob(null);

    if (!over || !job || !newStatus) return;
    changeStatus(job, newStatus);
  }

  const jobsByStatus = new Map<ApplicationStatus, Job[]>(
    STATUS_OPTIONS.map((option) => [option.value, []]),
  );
  jobs?.forEach((job) => {
    jobsByStatus.get(job.status)?.push(job);
  });

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 sm:py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-semibold sm:text-4xl">Board</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="hidden sm:inline">
              Drag a job between columns to update its status.
            </span>
            <span className="sm:hidden">
              Use the status menu on a job to update it.
            </span>
          </p>
        </div>

        {isPending ? (
          <>
            <div className="mt-6 hidden gap-4 overflow-x-auto pb-4 sm:flex">
              {STATUS_OPTIONS.map((option) => (
                <Skeleton
                  key={option.value}
                  className="h-96 w-72 shrink-0 rounded-xl"
                />
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:hidden">
              {STATUS_OPTIONS.map((option) => (
                <Skeleton key={option.value} className="h-32 rounded-xl" />
              ))}
            </div>
          </>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="mt-6 hidden snap-x gap-4 overflow-x-auto pb-4 sm:flex">
                {STATUS_OPTIONS.map((option) => (
                  <BoardColumn
                    key={option.value}
                    status={option.value}
                    jobs={jobsByStatus.get(option.value) ?? []}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeJob && <BoardCardContent job={activeJob} dragging />}
              </DragOverlay>
            </DndContext>

            <BoardMobileList
              jobsByStatus={jobsByStatus}
              onStatusChange={changeStatus}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default BoardPage;
