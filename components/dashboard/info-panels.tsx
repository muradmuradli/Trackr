import { trpc } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Activity,
  Users,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

const InfoPanels = () => {
  const { data } = trpc.jobs.stats.useQuery();

  if (!data) return <InfoPanelsSkeleton />;

  return (
    <div className="w-full grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8">
      <InfoPanel
        title="Total Applications"
        content={data.total}
        subtitle="All tracked roles"
        icon={Briefcase}
      />
      <InfoPanel
        title="Active"
        content={data.active}
        subtitle="Not rejected or withdrawn"
        icon={Activity}
      />
      <InfoPanel
        title="Interviewing"
        content={data.interviewing}
        subtitle="Screens and interviews"
        icon={Users}
      />
      <InfoPanel
        title="Response Rate"
        content={data.responseRate}
        suffix="%"
        subtitle="Of submitted applications"
        icon={TrendingUp}
      />
    </div>
  );
};

const InfoPanel = ({
  title,
  content,
  subtitle,
  suffix = "",
  icon: Icon,
}: {
  title: string;
  content: number;
  subtitle: string;
  suffix?: string;
  icon: LucideIcon;
}) => {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-1 bg-white dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-slate-900 font-light dark:text-slate-100">
          {title}
        </h2>
        <div className="rounded-lg bg-slate-100 p-2 dark:bg-slate-800">
          <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>
      <span className="text-2xl font-semibold">
        {content}
        {suffix}
      </span>
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {subtitle}
      </span>
    </div>
  );
};

export const InfoPanelsSkeleton = () => {
  return (
    <div className="w-full grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="border rounded-lg p-4 flex flex-col gap-1 bg-white dark:bg-slate-900"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="mt-1 h-7 w-14" />
          <Skeleton className="mt-1 h-3 w-28" />
        </div>
      ))}
    </div>
  );
};

export default InfoPanels;
