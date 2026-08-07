import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/routers/_app";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const trpc = createTRPCReact<AppRouter>();

export function getInitials(name?: string) {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
