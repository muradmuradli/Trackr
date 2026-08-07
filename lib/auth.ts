import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { brevo, EMAIL_SENDER } from "@/lib/brevo";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await brevo.transactionalEmails.sendTransacEmail({
        sender: EMAIL_SENDER,
        to: [{ email: user.email }],
        subject: "Reset your password",
        htmlContent: `<p>Click below to reset your password:</p><a href="${url}">${url}</a>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true, // fires automatically right after sign-up
    sendVerificationEmail: async ({ user, url }) => {
      await brevo.transactionalEmails.sendTransacEmail({
        sender: EMAIL_SENDER,
        to: [{ email: user.email }],
        subject: "Verify your account",
        htmlContent: `
          <h1>Welcome!</h1>
          <p>Click the link below to verify your account:</p>
          <a href="${url}">${url}</a>
        `,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});

export type Session = Awaited<ReturnType<typeof auth.api.getSession>>;
