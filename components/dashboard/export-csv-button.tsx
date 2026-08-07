"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/application";
import { downloadCsv, toCsv } from "@/lib/csv";
import { trpc } from "@/lib/utils";
import type { RouterOutputs } from "@/types";
import { format } from "date-fns";
import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";
import type { StatusFilter } from "@/components/dashboard/search";

type Job = RouterOutputs["jobs"]["exportAll"][number];

const ExportCsvButton = ({
  query,
  status,
}: {
  query: string;
  status: StatusFilter;
}) => {
  const utils = trpc.useUtils();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const jobs = await utils.jobs.exportAll.fetch({
        query: query || undefined,
        status: status === "all" ? undefined : status,
      });

      if (jobs.length === 0) {
        toast.error("No applications to export.");
        return;
      }

      const csv = toCsv<Job>(jobs, [
        { key: "companyName", label: "Company" },
        { key: "roleTitle", label: "Role" },
        {
          key: "status",
          label: "Status",
          format: (job) => STATUS_LABELS[job.status],
        },
        {
          key: "date",
          label: "Applied Date",
          format: (job) => format(new Date(job.date), "yyyy-MM-dd"),
        },
        {
          key: "source",
          label: "Source",
          format: (job) => SOURCE_LABELS[job.source],
        },
        {
          key: "salaryMin",
          label: "Salary Min",
          format: (job) => job.salaryMin ?? "",
        },
        {
          key: "salaryMax",
          label: "Salary Max",
          format: (job) => job.salaryMax ?? "",
        },
        { key: "jobUrl", label: "Job URL", format: (job) => job.jobUrl ?? "" },
        { key: "notes", label: "Notes", format: (job) => job.notes ?? "" },
      ]);

      downloadCsv(`trackr-applications-${format(new Date(), "yyyy-MM-dd")}.csv`, csv);
    } catch (error) {
      console.error(error);
      toast.error("Failed to export applications. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={exporting}
      className="bg-white py-5 shadow-sm shadow-slate-300 dark:bg-slate-900 dark:shadow-none"
    >
      <DownloadIcon className="h-4 w-4" />
      {exporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
};

export default ExportCsvButton;
