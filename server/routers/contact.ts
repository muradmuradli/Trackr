import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../trpc";
import { brevo, EMAIL_SENDER } from "@/lib/brevo";

// Where contact messages actually land — the address you check, which can
// differ from EMAIL_SENDER (the verified "from" identity Brevo sends as).
const CONTACT_RECIPIENT = "mmuradmuradlii@gmail.com";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const contactRouter = router({
  send: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(1).max(100).optional().or(z.literal("")),
        email: z.email(),
        title: z.string().trim().min(1, "Title is required").max(200),
        description: z
          .string()
          .trim()
          .min(1, "Message is required")
          .max(5000),
      }),
    )
    .mutation(async ({ input }) => {
      const fromLine = input.name
        ? `${escapeHtml(input.name)} &lt;${escapeHtml(input.email)}&gt;`
        : escapeHtml(input.email);

      try {
        await brevo.transactionalEmails.sendTransacEmail({
          sender: EMAIL_SENDER,
          to: [{ email: CONTACT_RECIPIENT }],
          replyTo: { email: input.email, name: input.name || undefined },
          subject: `[Trackr Contact] ${input.title}`,
          htmlContent: `
            <p><strong>From:</strong> ${fromLine}</p>
            <p><strong>Title:</strong> ${escapeHtml(input.title)}</p>
            <p>${escapeHtml(input.description).replace(/\n/g, "<br/>")}</p>
          `,
        });
      } catch (error) {
        console.error(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send message. Please try again.",
        });
      }

      return { success: true };
    }),
});
