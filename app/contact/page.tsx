import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import ContactForm from "@/components/contact/contact-form";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ContactPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Navbar initialSession={session} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
          Get in touch
        </h1>

        <p className="mt-6 text-slate-600 dark:text-slate-400">
          Bug report, feature idea, or just curious how something works —
          send a message and I&apos;ll get back to you. I read everything,
          even if it takes a bit to reply.
        </p>

        <ContactForm />
      </main>
      <Footer />
    </div>
  );
}
