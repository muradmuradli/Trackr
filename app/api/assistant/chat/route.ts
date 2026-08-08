import { createHash } from "crypto";
import { groq } from "@ai-sdk/groq";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { createCaller } from "@/server/routers/_app";
import { SOURCE_LABELS, STATUS_LABELS, STATUS_VALUES } from "@/lib/application";

export const maxDuration = 30;

// Signs tool-approval requests so an approval can't be replayed against a
// tampered client message history with different arguments than what the
// user actually saw and confirmed. Derived from an existing secret rather
// than requiring a new env var — purpose-separated via the suffix.
const toolApprovalSecret = createHash("sha256")
  .update(`${process.env.BETTER_AUTH_SECRET}:assistant-tool-approval`)
  .digest();

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const caller = createCaller({ session });
  const [stats, analytics, jobs] = await Promise.all([
    caller.jobs.stats(),
    caller.jobs.analytics(),
    caller.jobs.board(),
  ]);

  const jobsById = new Map(jobs.map((job) => [job.id, job]));

  const jobSummaries = jobs.map((job) => ({
    id: job.id,
    company: job.companyName,
    role: job.roleTitle,
    status: STATUS_LABELS[job.status],
    source: SOURCE_LABELS[job.source],
    appliedDate: format(new Date(job.date), "yyyy-MM-dd"),
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
  }));

  const buildUpdatePayload = (
    job: (typeof jobs)[number],
    overrides: { status?: (typeof STATUS_VALUES)[number]; notes?: string },
  ) => ({
    companyName: job.companyName,
    roleTitle: job.roleTitle,
    jobUrl: job.jobUrl ?? "",
    status: job.status,
    date: job.date,
    source: job.source,
    salaryMin: job.salaryMin ?? undefined,
    salaryMax: job.salaryMax ?? undefined,
    notes: job.notes ?? undefined,
    ...overrides,
  });

  // Both tools act on exactly one job, addressed only by an id that's
  // already in this user's own applications list — never a filter, never a
  // batch. Every call also requires explicit user approval (toolApproval
  // below) before it executes.
  const tools = {
    updateJobStatus: tool({
      description:
        "Change the status of exactly one job application, identified by its id. Only use an id that appears in the applications list you were given — never guess one, and never call this more than once per application in a single turn.",
      inputSchema: z.object({
        jobId: z
          .string()
          .describe(
            "The id of the job application, exactly as given in the applications list.",
          ),
        status: z.enum(STATUS_VALUES).describe("The new status to set."),
      }),
      execute: async ({ jobId, status }) => {
        const job = jobsById.get(jobId);
        if (!job) {
          return { error: "No application with that id exists for this user." };
        }
        const updated = await caller.jobs.update({
          id: jobId,
          ...buildUpdatePayload(job, { status }),
        });
        return {
          company: updated.companyName,
          role: updated.roleTitle,
          status: STATUS_LABELS[updated.status],
        };
      },
    }),
    addNote: tool({
      description:
        "Append a note to exactly one job application, identified by its id. Adds to any existing notes rather than replacing them. Only use an id that appears in the applications list you were given.",
      inputSchema: z.object({
        jobId: z
          .string()
          .describe(
            "The id of the job application, exactly as given in the applications list.",
          ),
        note: z.string().min(1).describe("The note text to add."),
      }),
      execute: async ({ jobId, note }) => {
        const job = jobsById.get(jobId);
        if (!job) {
          return { error: "No application with that id exists for this user." };
        }
        const notes = job.notes ? `${job.notes}\n${note}` : note;
        const updated = await caller.jobs.update({
          id: jobId,
          ...buildUpdatePayload(job, { notes }),
        });
        return {
          company: updated.companyName,
          role: updated.roleTitle,
          note,
        };
      },
    }),
  };

  const system = `You are the in-app assistant for Trackr, a job application tracker. You're helping ${session.user.name} understand their own job search.

Below is their current pipeline data, as of now. Use it to answer questions, spot patterns, and point out weaknesses (e.g. a stage with a low conversion rate, roles that go stale without follow-up, sources that underperform). Only state numbers that are present in or directly computable from this data — never invent statistics. If the data can't answer something, say so.

You can also take two kinds of action, always on exactly one application at a time, identified by its id — never a batch, never a filter, never a guessed id:
- updateJobStatus: change one application's status.
- addNote: append a note to one application.
Only ever act on ids from the applications list below. The user must explicitly approve every action before it happens, so propose one action at a time and briefly say why.

Keep answers short and conversational, like a knowledgeable friend, not a report. Use the person's own words for companies/roles when referencing specific applications.

Summary: ${JSON.stringify(stats)}
Funnel (distinct applications that ever reached each stage, in order): ${JSON.stringify(analytics.funnel)}
Current status breakdown: ${JSON.stringify(analytics.distribution)}
Applications by month: ${JSON.stringify(analytics.byMonth)}
All ${jobSummaries.length} applications: ${JSON.stringify(jobSummaries)}`;

  const result = streamText({
    model: groq(process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"),
    system,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: stepCountIs(5),
    toolApproval: {
      updateJobStatus: "user-approval",
      addNote: "user-approval",
    },
    experimental_toolApprovalSecret: toolApprovalSecret,
  });

  return result.toUIMessageStreamResponse();
}
