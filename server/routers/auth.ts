import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { publicProcedure, router } from "../trpc";
import { db } from "@/db";
import { account, verification } from "@/db/schema";

export const authRouter = router({
  // Lets the reset-password page tell a social-only user (e.g. signed up via
  // Google, no credential account) that they're setting a password for the
  // first time rather than "resetting" one — without leaking anything to
  // someone who hasn't already clicked a valid emailed reset link.
  getResetTokenInfo: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ input }) => {
      const [record] = await db
        .select({ userId: verification.value, expiresAt: verification.expiresAt })
        .from(verification)
        .where(eq(verification.identifier, `reset-password:${input.token}`))
        .limit(1);

      if (!record || record.expiresAt < new Date()) {
        return { valid: false, hasPassword: false };
      }

      const [credentialAccount] = await db
        .select({ id: account.id })
        .from(account)
        .where(
          and(
            eq(account.userId, record.userId),
            eq(account.providerId, "credential"),
          ),
        )
        .limit(1);

      return { valid: true, hasPassword: !!credentialAccount };
    }),
});
