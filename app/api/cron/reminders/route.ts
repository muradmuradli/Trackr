import { NextResponse } from "next/server";
import { and, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db";
import { jobApplications, user } from "@/db/schema";
import { resend } from "@/lib/resend";

// A job counts as "waiting on someone else" only in these two statuses —
// "saved" hasn't been sent yet, and offer/rejected/withdrawn are resolved.
const REMINDABLE_STATUSES = ["applied", "interview"] as const;

const STALE_DAYS = 7;
const COOLDOWN_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

function getAppUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function buildDigestHtml(
  name: string,
  jobs: { id: string; companyName: string; roleTitle: string }[],
  appUrl: string,
) {
  const rows = jobs
    .map(
      (job) =>
        `<li><a href="${appUrl}/dashboard/jobs/${job.id}">${job.roleTitle} at ${job.companyName}</a></li>`,
    )
    .join("");

  return `
    <p>Hi ${name},</p>
    <p>These applications haven't been updated in a while — might be worth a follow-up:</p>
    <ul>${rows}</ul>
    <p><a href="${appUrl}/dashboard/board">View your board</a></p>
  `;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleThreshold = new Date(Date.now() - STALE_DAYS * DAY_MS);
  const cooldownThreshold = new Date(Date.now() - COOLDOWN_DAYS * DAY_MS);

  const staleJobs = await db
    .select({
      id: jobApplications.id,
      userId: jobApplications.userId,
      companyName: jobApplications.companyName,
      roleTitle: jobApplications.roleTitle,
    })
    .from(jobApplications)
    .where(
      and(
        inArray(jobApplications.status, REMINDABLE_STATUSES),
        lt(jobApplications.updatedAt, staleThreshold),
        or(
          isNull(jobApplications.lastReminderSentAt),
          lt(jobApplications.lastReminderSentAt, cooldownThreshold),
        ),
      ),
    );

  if (staleJobs.length === 0) {
    return NextResponse.json({ remindersSent: 0, jobsFlagged: 0 });
  }

  const jobsByUser = new Map<string, typeof staleJobs>();
  for (const job of staleJobs) {
    const existing = jobsByUser.get(job.userId) ?? [];
    existing.push(job);
    jobsByUser.set(job.userId, existing);
  }

  const users = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(inArray(user.id, [...jobsByUser.keys()]));

  const appUrl = getAppUrl();
  let remindersSent = 0;

  for (const recipient of users) {
    const jobs = jobsByUser.get(recipient.id) ?? [];
    if (jobs.length === 0) continue;

    await resend.emails.send({
      from: "Trackr <onboarding@resend.dev>",
      to: recipient.email,
      subject:
        jobs.length === 1
          ? `Time to follow up on ${jobs[0].companyName}?`
          : `You have ${jobs.length} applications to follow up on`,
      html: buildDigestHtml(recipient.name, jobs, appUrl),
    });

    remindersSent += 1;
  }

  await db
    .update(jobApplications)
    .set({ lastReminderSentAt: new Date() })
    .where(
      inArray(
        jobApplications.id,
        staleJobs.map((job) => job.id),
      ),
    );

  return NextResponse.json({ remindersSent, jobsFlagged: staleJobs.length });
}
