"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import ChartCard from "@/components/dashboard/chart-card";
import { useIsDark } from "@/hooks/use-is-dark";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/application";
import { STATUS_CATEGORICAL } from "@/lib/analytics-colors";

type StatusCount = { status: ApplicationStatus; count: number };

const StatusDistributionChart = ({ data }: { data: StatusCount[] }) => {
  const isDark = useIsDark();
  const mode = isDark ? "dark" : "light";
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const total = data.reduce((sum, row) => sum + row.count, 0);
  const max = Math.max(1, ...data.map((row) => row.count));

  if (total === 0) {
    return (
      <ChartCard
        title="Status distribution"
        description="Where your tracked applications stand today"
        chart={<EmptyState />}
        table={<EmptyState />}
      />
    );
  }

  return (
    <ChartCard
      title="Status distribution"
      description="Where your tracked applications stand today"
      chart={
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 0 }}
              barSize={18}
            >
              <XAxis type="number" hide domain={[0, max]} />
              <YAxis
                type="category"
                dataKey="status"
                tickFormatter={(value: ApplicationStatus) => STATUS_LABELS[value]}
                tick={{ fill: tickFill, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={78}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_CATEGORICAL[entry.status][mode]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  className="fill-slate-900 dark:fill-slate-100"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs text-slate-400 dark:text-slate-500">
              <th className="pb-2 font-normal">Status</th>
              <th className="pb-2 font-normal text-right">Applications</th>
              <th className="pb-2 font-normal text-right">% of total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.status}
                className="border-t border-slate-100 dark:border-slate-800"
              >
                <td className="py-1.5 text-slate-700 dark:text-slate-300">
                  {STATUS_LABELS[row.status]}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                  {row.count}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                  {total === 0 ? "—" : `${Math.round((row.count / total) * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
};

const EmptyState = () => (
  <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
    No applications yet.
  </div>
);

export default StatusDistributionChart;
