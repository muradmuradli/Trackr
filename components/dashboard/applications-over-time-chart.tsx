"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "@/components/dashboard/chart-card";
import { useIsDark } from "@/hooks/use-is-dark";
import { TREND_HUE } from "@/lib/analytics-colors";

type MonthCount = { month: string; count: number };

const formatMonth = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  return new Date(year, m - 1, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const ApplicationsOverTimeChart = ({ data }: { data: MonthCount[] }) => {
  const isDark = useIsDark();
  const hue = isDark ? TREND_HUE.dark : TREND_HUE.light;
  const gridStroke = isDark ? "#1e293b" : "#e2e8f0";
  const tickFill = isDark ? "#94a3b8" : "#64748b";

  if (data.length === 0) {
    return (
      <ChartCard
        title="Applications over time"
        description="How many roles you've added, by month"
        chart={<EmptyState />}
        table={<EmptyState />}
      />
    );
  }

  return (
    <ChartCard
      title="Applications over time"
      description="How many roles you've added, by month"
      chart={
        <div className="h-64 w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
            initialDimension={{ width: 400, height: 256 }}
          >
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16 }}>
              <CartesianGrid
                stroke={gridStroke}
                vertical={false}
                strokeDasharray="0"
              />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fill: tickFill, fontSize: 12 }}
                axisLine={{ stroke: gridStroke }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: tickFill, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                cursor={{ stroke: gridStroke }}
                formatter={(value) => [`${value}`, "Applications"]}
                labelFormatter={(label) => formatMonth(String(label))}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: `1px solid ${gridStroke}`,
                  background: isDark ? "#0f172a" : "#ffffff",
                  color: isDark ? "#f1f5f9" : "#0f172a",
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={hue}
                strokeWidth={2}
                fill={hue}
                fillOpacity={0.1}
                dot={{ r: 4, fill: hue, stroke: isDark ? "#0f172a" : "#fff", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-slate-400 dark:text-slate-500">
                <th className="pb-2 font-normal">Month</th>
                <th className="pb-2 font-normal text-right">Applications</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.month}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="py-1.5 text-slate-700 dark:text-slate-300">
                    {formatMonth(row.month)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
};

const EmptyState = () => (
  <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
    No applications yet.
  </div>
);

export default ApplicationsOverTimeChart;
