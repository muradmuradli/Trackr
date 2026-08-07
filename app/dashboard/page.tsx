"use client";

import { Suspense, useState } from "react";
import AddJobButton from "@/components/dashboard/add-job-button";
import ExportCsvButton from "@/components/dashboard/export-csv-button";
import ImportCsvButton from "@/components/dashboard/import-csv-button";
import InfoPanels from "@/components/dashboard/info-panels";
import JobsPagination from "@/components/dashboard/jobs-pagination";
import JobsTable from "@/components/dashboard/jobs-table";
import JobsTableSkeleton from "@/components/dashboard/jobs-table-skeleton";
import Search, { StatusFilter } from "@/components/dashboard/search";
import WelcomeToast from "@/components/dashboard/welcome-toast";
import { trpc } from "@/lib/utils";
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
      <Suspense>
        <WelcomeToast />
      </Suspense>
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

        <div className="my-6 flex flex-col gap-3 sm:my-10 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Search
              query={query}
              onQueryChange={setQuery}
              status={status}
              onStatusChange={setStatus}
            />
          </div>
          <div className="flex items-center gap-2">
            <ImportCsvButton />
            <ExportCsvButton query={debouncedQuery} status={status} />
          </div>
        </div>

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
