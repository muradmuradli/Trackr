"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TableIcon, ChartColumnIcon } from "lucide-react";

const ChartCard = ({
  title,
  description,
  chart,
  table,
  className = "",
}: {
  title: string;
  description: string;
  chart: ReactNode;
  table: ReactNode;
  className?: string;
}) => {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <div
      className={`border rounded-lg p-4 sm:p-6 bg-white dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          onClick={() => setView(view === "chart" ? "table" : "chart")}
          aria-label={view === "chart" ? "View as table" : "View as chart"}
        >
          {view === "chart" ? (
            <TableIcon className="h-4 w-4" />
          ) : (
            <ChartColumnIcon className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="mt-4">{view === "chart" ? chart : table}</div>
    </div>
  );
};

export default ChartCard;
