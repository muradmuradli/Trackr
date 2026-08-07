import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import MockPipeline from "./mock-pipeline";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-blue-50 to-white dark:from-blue-950/30 dark:to-slate-950">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-32">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
          New — Interview reminders are here
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
          Track every application.
          <br />
          <span className="text-blue-700 dark:text-blue-400">
            Land the job.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-slate-500 sm:text-lg dark:text-slate-400">
          The calm, organized workspace for your job search. Track applications,
          follow-ups, and interviews — all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="bg-blue-700 px-5 py-5 text-white hover:bg-blue-600"
            asChild
          >
            <Link href="/auth?mode=sign-up">
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="px-5 py-5" asChild>
            <Link href="/auth?mode=login">Log In</Link>
          </Button>
        </div>

        <div className="mx-auto mt-12 max-w-5xl sm:mt-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200 sm:p-3 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
            <MockPipeline />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
