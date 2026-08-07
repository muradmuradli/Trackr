"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import Logo from "@/components/logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/utils";
import ThemeToggle from "@/components/theme-toggle";
import type { Session } from "@/lib/auth";

const Navbar = ({ initialSession = null }: { initialSession?: Session }) => {
  const router = useRouter();
  const { data: clientSession, isPending } = authClient.useSession();
  // Trust the server-resolved session for the first paint so logged-out
  // visitors see the real nav immediately instead of a loading skeleton;
  // once the client hook settles, its value takes over for reactivity.
  const session = isPending ? initialSession : clientSession;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth?mode=login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />

          {session && (
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-slate-600 dark:text-slate-300"
                asChild
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                variant="ghost"
                className="text-slate-600 dark:text-slate-300"
                asChild
              >
                <Link href="/dashboard/board">Board</Link>
              </Button>
              <Button
                variant="ghost"
                className="text-slate-600 dark:text-slate-300"
                asChild
              >
                <Link href="/dashboard/analytics">Analytics</Link>
              </Button>
            </div>
          )}

          {session ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src={session.user.image ?? undefined} />
                    <AvatarFallback>
                      {getInitials(session.user.name)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        Profile
                        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/board">Board</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/analytics">Analytics</Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleSignOut}>
                      Log out
                      <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="hidden text-sm font-semibold sm:inline">
                {session.user.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                className="text-slate-600 dark:text-slate-300"
                asChild
              >
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
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
