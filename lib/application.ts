export const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export const SOURCE_OPTIONS = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "company_website", label: "Company Website" },
  { value: "other", label: "Other" },
] as const;

export type ApplicationStatus = (typeof STATUS_OPTIONS)[number]["value"];
export type ApplicationSource = (typeof SOURCE_OPTIONS)[number]["value"];

export const STATUS_LABELS: Record<ApplicationStatus, string> =
  Object.fromEntries(
    STATUS_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<ApplicationStatus, string>;

export const SOURCE_LABELS: Record<ApplicationSource, string> =
  Object.fromEntries(
    SOURCE_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<ApplicationSource, string>;

export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  saved: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  applied: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  interview:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  offer:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  rejected: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  withdrawn: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export const STATUS_DOT_CLASSES: Record<ApplicationStatus, string> = {
  saved: "bg-slate-400",
  applied: "bg-blue-500",
  interview: "bg-amber-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-500",
  withdrawn: "bg-zinc-400",
};
