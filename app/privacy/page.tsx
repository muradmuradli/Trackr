import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function PrivacyPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar initialSession={session} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          Privacy
        </h1>
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
          Last updated August 2026
        </p>

        <div className="mt-8 space-y-8 text-slate-600 dark:text-slate-400">
          <p>
            Trackr is a small, independently run project, not a company with
            a data-processing department. This page just explains, plainly,
            what data it handles and why — no fine print you need a lawyer
            for.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              What&apos;s collected
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Account info</strong> — your name and email, and
                either a password (stored as a salted hash, never in plain
                text) or your Google/GitHub identity if you sign in that way.
              </li>
              <li>
                <strong>What you enter</strong> — the companies, roles,
                statuses, dates, salary ranges, and notes you add for your
                own job applications.
              </li>
              <li>
                <strong>Files you upload</strong> — a profile picture and any
                documents (resumes, offer letters) you attach to an
                application.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              How your files are stored
            </h2>
            <p className="mt-3">
              Uploads go to Cloudinary. Your avatar is a normal public image
              (it needs to load anywhere your profile picture appears).
              Application documents are not — they use Cloudinary&apos;s
              authenticated delivery, meaning there is no public URL for
              them. The app generates a fresh, short-lived signed link only
              when you ask to view or download one.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              The AI assistant
            </h2>
            <p className="mt-3">
              If you use the chat assistant, each message you send is
              accompanied by a fresh snapshot of your own application data,
              sent to Groq (the AI provider behind it) to generate a
              response. Nothing else — no other user&apos;s data, no account
              secrets — is ever included. That snapshot isn&apos;t stored by
              Trackr beyond the request itself; whatever retention applies
              after that is Groq&apos;s, as the model provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Email
            </h2>
            <p className="mt-3">
              Trackr sends transactional email only — verifying your address,
              password resets, and (if applications go quiet) a follow-up
              reminder. No marketing, no newsletters, no sharing your address
              with anyone else. Email is sent through Brevo.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Cookies
            </h2>
            <p className="mt-3">
              Just one that matters: a session cookie that keeps you logged
              in. No advertising or cross-site tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Who else touches this data
            </h2>
            <p className="mt-3">
              A handful of infrastructure providers, and only for the
              purpose of running the app: Neon (database hosting), Cloudinary
              (file storage), Brevo (sending email), and Groq (only if you
              use the AI assistant). Nobody&apos;s data is sold, and none of it is
              shared beyond what these providers need to do their one job.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Deleting your data
            </h2>
            <p className="mt-3">
              There&apos;s no self-serve delete button yet. Email me (see{" "}
              <a
                href="/contact"
                className="text-blue-700 hover:underline dark:text-blue-400"
              >
                Contact
              </a>
              ) and I&apos;ll remove your account and everything attached to it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Changes
            </h2>
            <p className="mt-3">
              If this page changes in any way that matters, the date at the
              top will change with it. Given the scale of this project,
              don&apos;t expect that to happen often.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
