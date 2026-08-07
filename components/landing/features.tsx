import { ArrowRight, Bell, CheckCircle2, LayoutGrid } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: LayoutGrid,
      title: "Track Applications",
      body: "Visualize every role in one kanban board — from applied to offer. Drag, drop, done.",
    },
    {
      icon: Bell,
      title: "Never Miss a Follow-up",
      body: "Smart reminders nudge you when it's time to check in, so no opportunity slips away.",
    },
    {
      icon: CheckCircle2,
      title: "Stay Organized",
      body: "Notes, contacts, salary ranges, and interview prep — all attached to each application.",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          Everything you need. Nothing you don&apos;t.
        </h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          Built for job seekers who want clarity over chaos.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900 dark:text-slate-50">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
