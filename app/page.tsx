import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bell, CheckCircle2, LayoutGrid } from "lucide-react";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

function getInitials(name?: string) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Navbar({ session }: { session: Session }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        {session ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {getInitials(session.user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>
                    Profile
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    Settings
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <span>{session?.user.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" className="text-slate-600" asChild>
              <Link href="/auth?mode=login">Log in</Link>
            </Button>
            <Button
              className="bg-blue-700 hover:bg-blue-600 text-white"
              asChild
            >
              <Link href="/auth?mode=sign-up">Sign Up</Link>
            </Button>
          </div>
        )}
      </nav>
    </header>
  );
}

function MockPipeline() {
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
    <div className="rounded-xl bg-slate-50 p-3 sm:p-4">
      <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>
        <div className="hidden text-xs font-medium text-slate-500 sm:block">
          My Pipeline · 6 active
        </div>
        <div className="h-6 w-20 rounded-md bg-blue-50" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {columns.map((col) => (
          <div
            key={col.title}
            className="rounded-lg bg-white p-3 text-left shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {col.title}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {col.items.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.items.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-slate-200 bg-white p-3 text-xs shadow-sm"
                >
                  <div className="font-medium text-slate-700">{item}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>2d ago</span>
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-700">
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
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:px-6 sm:pt-24 sm:pb-32">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
          New — Interview reminders are here
        </div>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
          Track every application.
          <br />
          <span className="text-blue-700">Land the job.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-base text-slate-500 sm:text-lg">
          The calm, organized workspace for your job search. Track applications,
          follow-ups, and interviews — all in one place.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="bg-blue-700 px-5 py-5 hover:bg-blue-600"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200 sm:p-3">
            <MockPipeline />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
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
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Everything you need. Nothing you don't.
        </h2>
        <p className="mt-4 text-slate-500">
          Built for job seekers who want clarity over chaos.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700">
              <f.icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              {f.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="grid h-6 w-6 place-items-center rounded-md bg-blue-700 text-white">
            <span className="text-[10px] font-bold">T</span>
          </div>
          <span>© 2026 Trackr</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-500">
          <a href="#" className="hover:text-slate-700">
            About
          </a>
          <a href="#" className="hover:text-slate-700">
            Contact
          </a>
          <a href="#" className="hover:text-slate-700">
            Privacy
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    // redirect to login, etc.
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar session={session} />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
