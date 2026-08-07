// hooks/use-is-dark.ts
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function useIsDark(): boolean {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-mount detection has no render-time equivalent; matches next-themes' documented pattern
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "dark";
}
