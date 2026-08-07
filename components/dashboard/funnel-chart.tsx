"use client";

import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import ChartCard from "@/components/dashboard/chart-card";
import { useIsDark } from "@/hooks/use-is-dark";
import { STATUS_LABELS, type ApplicationStatus } from "@/lib/application";
import { FUNNEL_RAMP } from "@/lib/analytics-colors";

type FunnelStage = { stage: ApplicationStatus; count: number };

const FunnelChart = ({ data }: { data: FunnelStage[] }) => {
  const isDark = useIsDark();
  const ramp = isDark ? FUNNEL_RAMP.dark : FUNNEL_RAMP.light;
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const first = data[0]?.count ?? 0;

  if (first === 0) {
    return (
      <ChartCard
        title="Application funnel"
        description="How far applications get, saved through offer"
        chart={<EmptyState />}
        table={<EmptyState />}
      />
    );
  }

  return (
    <ChartCard
      title="Application funnel"
      description="How far applications get, saved through offer"
      chart={
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 48, left: 0 }}
              barSize={22}
            >
              <XAxis type="number" hide domain={[0, first]} />
              <YAxis
                type="category"
                dataKey="stage"
                tickFormatter={(value: ApplicationStatus) => STATUS_LABELS[value]}
                tick={{ fill: tickFill, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((entry, index) => (
                  <Cell key={entry.stage} fill={ramp[index]} />
                ))}
                <LabelList
                  dataKey="count"
                  position="right"
                  content={(props) => (
                    <FunnelLabel {...props} first={first} dark={isDark} />
                  )}
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
              <th className="pb-2 font-normal">Stage</th>
              <th className="pb-2 font-normal text-right">Applications</th>
              <th className="pb-2 font-normal text-right">% of saved</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.stage}
                className="border-t border-slate-100 dark:border-slate-800"
              >
                <td className="py-1.5 text-slate-700 dark:text-slate-300">
                  {STATUS_LABELS[row.stage]}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-900 dark:text-slate-100">
                  {row.count}
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-500 dark:text-slate-400">
                  {first === 0 ? "—" : `${Math.round((row.count / first) * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    />
  );
};

type LabelProps = {
  x?: unknown;
  y?: unknown;
  width?: unknown;
  height?: unknown;
  value?: unknown;
  first: number;
  dark: boolean;
};

const FunnelLabel = ({ x = 0, y = 0, width = 0, height = 0, value, first, dark }: LabelProps) => {
  const numValue = Number(value ?? 0);
  const pct = first === 0 ? 0 : Math.round((numValue / first) * 100);
  return (
    <text
      x={Number(x) + Number(width) + 8}
      y={Number(y) + Number(height) / 2}
      dy={4}
      fontSize={12}
      fill={dark ? "#f1f5f9" : "#0f172a"}
    >
      {numValue.toLocaleString()}
      <tspan fill={dark ? "#64748b" : "#94a3b8"}> · {pct}%</tspan>
    </text>
  );
};

const EmptyState = () => (
  <div className="flex h-40 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
    No applications yet.
  </div>
);

export default FunnelChart;
