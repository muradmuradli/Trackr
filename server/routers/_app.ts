import { router } from "../trpc";
import { jobsRouter } from "./jobs";
import { documentsRouter } from "./documents";

export const appRouter = router({
  jobs: jobsRouter,
  documents: documentsRouter,
});

export type AppRouter = typeof appRouter;
