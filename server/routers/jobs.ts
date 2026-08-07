import { z } from "zod";
import { eq, and, asc, desc, ilike, inArray, or, count } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/db";
import { jobApplications, jobStatusEvents } from "@/db/schema";
import { TRPCError } from "@trpc/server";

const STATUS_VALUES = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
] as const;

const jobSchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  jobUrl: z.url().optional().or(z.literal("")),
  status: z.enum(STATUS_VALUES),
  date: z.coerce.date(),
  source: z.enum(["linkedin", "company_website", "other"]),
  salaryMin: z.number().positive().optional(),
  salaryMax: z.number().positive().optional(),
  notes: z.string().optional(),
});

export const jobsRouter = router({
  create: protectedProcedure
    .input(jobSchema)
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const [application] = await tx
          .insert(jobApplications)
          .values({
            ...input,
            userId: ctx.session.user.id,
          })
          .returning();

        await tx.insert(jobStatusEvents).values({
          jobId: application.id,
          userId: ctx.session.user.id,
          status: application.status,
        });

        return application;
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [job] = await db
        .select()
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.id, input.id),
            eq(jobApplications.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      return job;
    }),

  getTimeline: protectedProcedure
    .input(z.object({ jobId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(jobStatusEvents)
        .where(
          and(
            eq(jobStatusEvents.jobId, input.jobId),
            eq(jobStatusEvents.userId, ctx.session.user.id),
          ),
        )
        .orderBy(asc(jobStatusEvents.createdAt));
    }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({ status: jobApplications.status, count: count() })
      .from(jobApplications)
      .where(eq(jobApplications.userId, ctx.session.user.id))
      .groupBy(jobApplications.status);

    const countByStatus = Object.fromEntries(
      rows.map((row) => [row.status, row.count]),
    ) as Partial<Record<(typeof rows)[number]["status"], number>>;

    const total = rows.reduce((sum, row) => sum + row.count, 0);
    const active =
      total - (countByStatus.rejected ?? 0) - (countByStatus.withdrawn ?? 0);
    const interviewing = countByStatus.interview ?? 0;
    const submitted = total - (countByStatus.saved ?? 0);
    const responded = submitted - (countByStatus.applied ?? 0);
    const responseRate =
      submitted === 0 ? 0 : Math.round((responded / submitted) * 100);

    return { total, active, interviewing, responseRate };
  }),

  list: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        status: z.enum(STATUS_VALUES).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(15),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(jobApplications.userId, ctx.session.user.id)];

      if (input.status) {
        conditions.push(eq(jobApplications.status, input.status));
      }

      if (input.query) {
        conditions.push(
          or(
            ilike(jobApplications.companyName, `%${input.query}%`),
            ilike(jobApplications.roleTitle, `%${input.query}%`),
          )!,
        );
      }

      const [items, [{ total }]] = await Promise.all([
        db
          .select()
          .from(jobApplications)
          .where(and(...conditions))
          .orderBy(desc(jobApplications.createdAt))
          .limit(input.pageSize)
          .offset((input.page - 1) * input.pageSize),
        db
          .select({ total: count() })
          .from(jobApplications)
          .where(and(...conditions)),
      ]);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
      };
    }),

  // Same filters as `list`, but no pagination — backs the CSV export, which
  // needs every matching row rather than one page of them.
  exportAll: protectedProcedure
    .input(
      z.object({
        query: z.string().optional(),
        status: z.enum(STATUS_VALUES).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(jobApplications.userId, ctx.session.user.id)];

      if (input.status) {
        conditions.push(eq(jobApplications.status, input.status));
      }

      if (input.query) {
        conditions.push(
          or(
            ilike(jobApplications.companyName, `%${input.query}%`),
            ilike(jobApplications.roleTitle, `%${input.query}%`),
          )!,
        );
      }

      return db
        .select()
        .from(jobApplications)
        .where(and(...conditions))
        .orderBy(desc(jobApplications.createdAt))
        .limit(5000);
    }),

  update: protectedProcedure
    .input(jobSchema.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      return db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ status: jobApplications.status })
          .from(jobApplications)
          .where(
            and(
              eq(jobApplications.id, id),
              eq(jobApplications.userId, ctx.session.user.id),
            ),
          )
          .limit(1);

        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

        const [updated] = await tx
          .update(jobApplications)
          .set({ ...data, updatedAt: new Date() })
          .where(
            and(
              eq(jobApplications.id, id),
              eq(jobApplications.userId, ctx.session.user.id),
            ),
          )
          .returning();

        if (existing.status !== data.status) {
          await tx.insert(jobStatusEvents).values({
            jobId: id,
            userId: ctx.session.user.id,
            status: data.status,
          });
        }

        return updated;
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(jobApplications)
        .where(
          and(
            eq(jobApplications.id, input.id),
            eq(jobApplications.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
      return deleted;
    }),

  bulkDelete: protectedProcedure
    .input(z.object({ ids: z.array(z.uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await db
        .delete(jobApplications)
        .where(
          and(
            inArray(jobApplications.id, input.ids),
            eq(jobApplications.userId, ctx.session.user.id),
          ),
        )
        .returning({ id: jobApplications.id });

      return { deletedIds: deleted.map((row) => row.id) };
    }),

  bulkUpdateStatus: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.uuid()).min(1),
        status: z.enum(STATUS_VALUES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const existing = await tx
          .select({ id: jobApplications.id, status: jobApplications.status })
          .from(jobApplications)
          .where(
            and(
              inArray(jobApplications.id, input.ids),
              eq(jobApplications.userId, ctx.session.user.id),
            ),
          );

        const changedIds = existing
          .filter((job) => job.status !== input.status)
          .map((job) => job.id);

        if (changedIds.length > 0) {
          await tx
            .update(jobApplications)
            .set({ status: input.status, updatedAt: new Date() })
            .where(
              and(
                inArray(jobApplications.id, changedIds),
                eq(jobApplications.userId, ctx.session.user.id),
              ),
            );

          await tx.insert(jobStatusEvents).values(
            changedIds.map((jobId) => ({
              jobId,
              userId: ctx.session.user.id,
              status: input.status,
            })),
          );
        }

        return { updatedIds: existing.map((job) => job.id) };
      });
    }),
});
