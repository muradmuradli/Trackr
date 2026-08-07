const MockPipeline = () => {
  const columns = [
    {
      title: "Applied",
      dot: "bg-blue-500",
      items: ["Stripe — Product Eng", "Linear — Design Eng", "Vercel — DX"],
    },
    {
      title: "Interviewing",
      dot: "bg-amber-500",
      items: ["Notion — Sr. Engineer", "Figma — Frontend"],
    },
    {
      title: "Offer",
      dot: "bg-emerald-500",
      items: ["Ashby — Full Stack"],
    },
  ];

  return (
    <div className="rounded-xl bg-slate-50 p-3 sm:p-4 dark:bg-slate-950">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="hidden text-xs font-medium text-slate-500 sm:block dark:text-slate-400">
          My Pipeline · 6 active
        </div>
        <div className="h-6 w-20 rounded-md bg-blue-50 dark:bg-blue-500/10" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.title}
            className="rounded-lg bg-white p-3 text-left shadow-sm dark:bg-slate-900 dark:shadow-none"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {col.title}
              </span>
              <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
                >
                  <div className="font-medium text-slate-700 dark:text-slate-300">
                    {item}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                    <span>2d ago</span>
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                      Remote
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MockPipeline;
