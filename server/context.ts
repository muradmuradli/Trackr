import { auth } from "@/lib/auth";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export const createContext = async ({ req }: FetchCreateContextFnOptions) => {
  const session = await auth.api.getSession({ headers: req.headers });

  return {
    session,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;
