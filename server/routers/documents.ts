import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { protectedProcedure, router } from "../trpc";
import { db } from "@/db";
import { jobApplications, jobDocuments } from "@/db/schema";
import { TRPCError } from "@trpc/server";
import cloudinary from "@/lib/cloudinary";

// Documents hold private user files (e.g. a CV with personal info), so every
// upload is stored as Cloudinary's "authenticated" delivery type — the file
// can't be fetched via a bare URL even if it leaks. Viewing requires a
// signed, short-lived link minted per-request by getDownloadUrl below.
const DELIVERY_TYPE = "authenticated";
const DOWNLOAD_URL_TTL_SECONDS = 5 * 60;

async function assertJobOwnership(jobId: string, userId: string) {
  const [job] = await db
    .select({ id: jobApplications.id })
    .from(jobApplications)
    .where(
      and(eq(jobApplications.id, jobId), eq(jobApplications.userId, userId)),
    )
    .limit(1);

  if (!job) throw new TRPCError({ code: "NOT_FOUND" });
}

export const documentsRouter = router({
  list: protectedProcedure
    .input(z.object({ jobId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      await assertJobOwnership(input.jobId, ctx.session.user.id);

      return db
        .select()
        .from(jobDocuments)
        .where(eq(jobDocuments.jobId, input.jobId))
        .orderBy(desc(jobDocuments.createdAt));
    }),

  getUploadSignature: protectedProcedure
    .input(z.object({ jobId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      await assertJobOwnership(input.jobId, ctx.session.user.id);

      const timestamp = Math.round(Date.now() / 1000);
      const folder = `trackr/${ctx.session.user.id}/${input.jobId}`;

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder, type: DELIVERY_TYPE },
        cloudinary.config().api_secret!,
      );

      return {
        signature,
        timestamp,
        folder,
        type: DELIVERY_TYPE,
        apiKey: cloudinary.config().api_key,
        cloudName: cloudinary.config().cloud_name,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        jobId: z.uuid(),
        name: z.string().min(1),
        url: z.url(),
        publicId: z.string().min(1),
        resourceType: z.string().min(1),
        format: z.string().optional(),
        size: z.number().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertJobOwnership(input.jobId, ctx.session.user.id);

      const [document] = await db
        .insert(jobDocuments)
        .values({ ...input, userId: ctx.session.user.id })
        .returning();

      return document;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(jobDocuments)
        .where(
          and(
            eq(jobDocuments.id, input.id),
            eq(jobDocuments.userId, ctx.session.user.id),
          ),
        )
        .returning();

      if (!deleted) throw new TRPCError({ code: "NOT_FOUND" });

      // The DB row is the source of truth for the app — a Cloudinary-side
      // cleanup failure (already gone, mismatched legacy type, etc.) shouldn't
      // surface as a failed delete to the user when the row is already removed.
      try {
        await cloudinary.uploader.destroy(deleted.publicId, {
          resource_type: deleted.resourceType,
          type: DELIVERY_TYPE,
        });
      } catch (error) {
        console.error("Failed to destroy Cloudinary asset", error);
      }

      return deleted;
    }),

  getDownloadUrl: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [document] = await db
        .select()
        .from(jobDocuments)
        .where(
          and(
            eq(jobDocuments.id, input.id),
            eq(jobDocuments.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!document) throw new TRPCError({ code: "NOT_FOUND" });

      const url = cloudinary.utils.private_download_url(
        document.publicId,
        document.format ?? "",
        {
          resource_type: document.resourceType,
          type: DELIVERY_TYPE,
          expires_at: Math.round(Date.now() / 1000) + DOWNLOAD_URL_TTL_SECONDS,
        },
      );

      return { url };
    }),
});
