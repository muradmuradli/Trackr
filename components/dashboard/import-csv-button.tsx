"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseJobsCsv } from "@/lib/csv-import";
import { trpc } from "@/lib/utils";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";

const MAX_ROWS_PER_IMPORT = 500;

const ImportCsvButton = () => {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const importMutation = trpc.jobs.bulkImport.useMutation({
    onSuccess: () => {
      utils.jobs.list.invalidate();
      utils.jobs.board.invalidate();
      utils.jobs.stats.invalidate();
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const { jobs, skipped } = parseJobsCsv(text);

      if (jobs.length === 0) {
        toast.error("No valid rows found in that file.");
        return;
      }

      const excess = Math.max(0, jobs.length - MAX_ROWS_PER_IMPORT);
      const jobsToImport = jobs.slice(0, MAX_ROWS_PER_IMPORT);

      const result = await importMutation.mutateAsync(jobsToImport);

      toast.success(
        `Imported ${result.count} application${result.count === 1 ? "" : "s"}.`,
      );

      const totalSkipped = skipped + excess;
      if (totalSkipped > 0) {
        toast.error(
          `Skipped ${totalSkipped} row${totalSkipped === 1 ? "" : "s"} — missing a company/role, or over the ${MAX_ROWS_PER_IMPORT}-row limit.`,
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to import applications. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className="bg-white py-5 shadow-sm shadow-slate-300 dark:bg-slate-900 dark:shadow-none"
      >
        <UploadIcon className="h-4 w-4" />
        {importing ? "Importing..." : "Import CSV"}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default ImportCsvButton;
