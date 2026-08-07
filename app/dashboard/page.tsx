"use client";

import AddJobButton from "@/components/dashboard/add-job-button";
import InfoPanels from "@/components/dashboard/info-panels";
import JobsPagination from "@/components/dashboard/jobs-pagination";
import JobsTable from "@/components/dashboard/jobs-table";
import JobsTableSkeleton from "@/components/dashboard/jobs-table-skeleton";
import Search, { StatusFilter } from "@/components/dashboard/search";
import { trpc } from "@/lib/utils";
import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

const PAGE_SIZE = 15;

const Dashboard = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const debouncedQuery = useDebouncedValue(query, 300);

  const [appliedFilters, setAppliedFilters] = useState({
    query: debouncedQuery,
    status,
  });
  if (
    appliedFilters.query !== debouncedQuery ||
    appliedFilters.status !== status
  ) {
    setAppliedFilters({ query: debouncedQuery, status });
    setPage(1);
  }

  const { data, isFetching } = trpc.jobs.list.useQuery(
    {
      query: debouncedQuery,
      status: status === "all" ? undefined : status,
      page,
      pageSize: PAGE_SIZE,
    },
    { placeholderData: keepPreviousData },
  );

  const jobs = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 w-full flex justify-center dark:bg-slate-950">
      <div className="w-full max-w-6xl px-4 my-6 sm:px-6 sm:my-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Trackr</h1>
            <span className="text-slate-500 text-sm dark:text-slate-400">
              Your pipeline, from saved roles to signed offers
            </span>
          </div>
          <AddJobButton />
        </div>

        <InfoPanels />

        <Search
          query={query}
          onQueryChange={setQuery}
          status={status}
          onStatusChange={setStatus}
        />

        <JobsPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-4"
        />

        {isFetching ? <JobsTableSkeleton /> : <JobsTable jobs={jobs} />}

        <JobsPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-4"
        />
      </div>
    </div>
  );
};

export default Dashboard;
