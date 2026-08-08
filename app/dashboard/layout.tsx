// app/dashboard/layout.tsx
import Navbar from "@/components/navbar";
import ChatWidget from "@/components/dashboard/chat-widget";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/auth?mode=login");
  }

  return (
    <>
      <Navbar initialSession={session} />
      {children}
      <ChatWidget />
    </>
  );
};

export default DashboardLayout;
