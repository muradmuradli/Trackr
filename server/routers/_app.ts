import { router } from "../trpc";
import { jobsRouter } from "./jobs";
import { documentsRouter } from "./documents";
import { profileRouter } from "./profile";
import { authRouter } from "./auth";

export const appRouter = router({
  jobs: jobsRouter,
  documents: documentsRouter,
  profile: profileRouter,
  auth: authRouter,
});

export type AppRouter = typeof appRouter;
