"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Every sign-in path (email/password, Google, GitHub) redirects here with
// ?welcome=true — social providers do a real page navigation away and back,
// so a toast fired before the redirect would never be seen; this is the one
// place all paths funnel through afterward.
const WelcomeToast = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "true";

  useEffect(() => {
    if (!welcome) return;
    toast.success("You've successfully signed in!");
    router.replace("/dashboard");
  }, [welcome, router]);

  return null;
};

export default WelcomeToast;
