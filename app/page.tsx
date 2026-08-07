import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import Features from "@/components/landing/features";
import Hero from "@/components/landing/hero";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar initialSession={session} />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
