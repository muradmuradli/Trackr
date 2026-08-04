import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { TRPCError } from "@trpc/server";

const applicationSchema = z.object({
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
    .input(applicationSchema)
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

  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, ctx.session.user.id))
      .orderBy(desc(jobApplications.createdAt));
  }),

  //   update: protectedProcedure
  //     .input(applicationSchema.partial().extend({ id: z.uuid() }))
  //     .mutation(async ({ ctx, input }) => {
  //       const { id, ...data } = input;

  //       const [updated] = await db
  //         .update(jobApplications)
  //         .set({ ...data, updatedAt: new Date() })
  //         .where(
  //           and(
  //             eq(jobApplications.id, id),
  //             eq(jobApplications.userId, ctx.session.user.id)
  //           )
  //         )
  //         .returning();

  //       if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
  //       return updated;
  //     }),

  //   delete: protectedProcedure
  //     .input(z.object({ id: z.uuid() }))
  //     .mutation(async ({ ctx, input }) => {
  //       const [deleted] = await db
  //         .delete(jobApplications)
  //         .where(
  //           and(
  //             eq(jobApplications.id, input.id),
  //             eq(jobApplications.userId, ctx.session.user.id)
  //           )
  //         )
  //         .returning();

  //       if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });
  //       return deleted;
  //     }),
});
