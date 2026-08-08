import { trpc } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import StatTile from "@/components/dashboard/stat-tile";
import {
  Briefcase,
  Activity,
  Users,
  TrendingUp,
} from "lucide-react";

const InfoPanels = () => {
  const { data } = trpc.jobs.stats.useQuery();

  if (!data) return <InfoPanelsSkeleton />;

  return (
    <div className="w-full grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8">
      <StatTile
        title="Total Applications"
        content={data.total}
        subtitle="All tracked roles"
        icon={Briefcase}
      />
      <StatTile
        title="Active"
        content={data.active}
        subtitle="Not rejected or withdrawn"
        icon={Activity}
      />
      <StatTile
        title="Interviewing"
        content={data.interviewing}
        subtitle="Screens and interviews"
        icon={Users}
      />
      <StatTile
        title="Response Rate"
        content={data.responseRate}
        suffix="%"
        subtitle="Of submitted applications"
        icon={TrendingUp}
      />
    </div>
  );
};

export const InfoPanelsSkeleton = () => {
  return (
    <div className="w-full grid grid-cols-2 gap-4 sm:grid-cols-4 mt-8">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="border border-slate-200 rounded-lg p-4 flex flex-col gap-1 bg-white dark:border-slate-800 dark:bg-slate-900"
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
