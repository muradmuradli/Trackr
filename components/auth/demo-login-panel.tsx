"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { CopyIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";

const DEMO_EMAIL = "trackr-test@tutamail.com";
const DEMO_PASSWORD = "hA{`*5qs6C3B^9_8";

async function copyToClipboard(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error("Couldn't copy — your browser may be blocking clipboard access.");
  }
}

const DemoLoginPanel = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDemoLogin() {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
    });
    setLoading(false);

    if (error) {
      toast.error(error.message ?? "Couldn't log in to the demo account.");
      return;
    }

    router.push("/dashboard?welcome=true");
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 text-center dark:border-slate-700 dark:bg-slate-900/40">
      <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
        <SparklesIcon className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
        Just want to look around?
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Skip the signup — log in with a shared demo account.
      </p>

      <Button
        type="button"
        onClick={handleDemoLogin}
        disabled={loading}
        size="sm"
        className="mt-3 bg-blue-700 text-white hover:bg-blue-600"
      >
        {loading ? "Logging in..." : "Log in as test user"}
      </Button>

      <div className="mt-3 flex flex-col items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
        <button
          type="button"
          onClick={() => copyToClipboard(DEMO_EMAIL, "Email")}
          className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200"
        >
          {DEMO_EMAIL}
          <CopyIcon className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => copyToClipboard(DEMO_PASSWORD, "Password")}
          className="inline-flex items-center gap-1 font-mono hover:text-slate-700 dark:hover:text-slate-200"
        >
          {DEMO_PASSWORD}
          <CopyIcon className="h-3 w-3" />
        </button>
      </div>

      <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
        Shared account — feel free to explore, but don&apos;t expect your
        changes to stick.
      </p>
    </div>
  );
};

export default DemoLoginPanel;
