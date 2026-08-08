import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AboutPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar initialSession={session} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          About Trackr
        </h1>

        <div className="mt-6 space-y-5 text-slate-600 dark:text-slate-400">
          <p>
            Trackr started as a personal itch: job searching produces a mess
            of spreadsheets, half-remembered follow-ups, and browser tabs you
            forgot to close. I wanted one place that actually reflected where
            things stood — what I&apos;d applied to, what needed a nudge, and
            what was quietly going nowhere.
          </p>
          <p>
            So that&apos;s what it is: a table and a board for your
            applications, a timeline that records itself as statuses change,
            reminders for the ones that have gone quiet, and a small
            analytics view so &quot;how&apos;s the search going&quot; has a real
            answer instead of a shrug. There&apos;s also a chat assistant that
            can answer questions about your own pipeline and, if you ask it
            to, make a change — but only one you&apos;ve explicitly approved.
          </p>
          <p>
            It&apos;s built and maintained by one person (hi — see{" "}
            <a
              href="/contact"
              className="text-blue-700 hover:underline dark:text-blue-400"
            >
              Contact
            </a>
            ), not a company. If something&apos;s broken or missing, that&apos;s
            useful to know.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
