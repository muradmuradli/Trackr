import { z } from "zod";
import { eq, and, desc, ilike, or, count } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { TRPCError } from "@trpc/server";

const jobSchema = z.object({
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  jobUrl: z.url().optional().or(z.literal("")),
  status: z.enum([
    "saved",
    "applied",
    "interview",
    "offer",
    "rejected",
    "withdrawn",
  ]),
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
      const [application] = await db
        .insert(jobApplications)
        .values({
          ...input,
          userId: ctx.session.user.id,
        })
        .returning();

      return application;
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
        status: z
          .enum([
            "saved",
            "applied",
            "interview",
            "offer",
            "rejected",
            "withdrawn",
          ])
          .optional(),
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

  update: protectedProcedure
    .input(jobSchema.extend({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const [updated] = await db
        .update(jobApplications)
        .set({ ...data, updatedAt: new Date() })
        .where(
          and(
            eq(jobApplications.id, id),
            eq(jobApplications.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
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
});
