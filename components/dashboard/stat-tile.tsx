import type { LucideIcon } from "lucide-react";

type StatTileProps = {
  title: string;
  content: number;
  subtitle?: string;
  suffix?: string;
  icon: LucideIcon;
  // "card" sits directly on the page background (e.g. the dashboard's own
  // stat row); "inset" sits nested inside an already-white/slate-900 card
  // (e.g. the profile page's "Your Pipeline" section) and needs a shaded
  // background of its own to stay visible against its container.
  variant?: "card" | "inset";
};

const StatTile = ({
  title,
  content,
  subtitle,
  suffix = "",
  icon: Icon,
  variant = "card",
}: StatTileProps) => {
  return (
    <div
      className={`rounded-lg border border-slate-200 p-4 dark:border-slate-800 ${
        variant === "card"
          ? "bg-white dark:bg-slate-900"
          : "bg-slate-50 dark:bg-slate-800/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </h3>
        {variant === "card" ? (
          <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
            <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          </div>
        ) : (
          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        )}
      </div>
      <span className="mt-1 block text-2xl font-semibold">
        {content}
        {suffix}
      </span>
      {subtitle && (
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default StatTile;
