import { createCallerFactory, router } from "../trpc";
import { jobsRouter } from "./jobs";
import { documentsRouter } from "./documents";
import { profileRouter } from "./profile";
import { authRouter } from "./auth";
import { contactRouter } from "./contact";

export const appRouter = router({
  jobs: jobsRouter,
  documents: documentsRouter,
  profile: profileRouter,
  auth: authRouter,
  contact: contactRouter,
});

export type AppRouter = typeof appRouter;

// Lets server-side code (e.g. the streaming assistant route) call procedures
// directly without a round-trip through the HTTP/tRPC client layer.
export const createCaller = createCallerFactory(appRouter);
