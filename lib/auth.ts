import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "Trackr <onboarding@resend.dev>",
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click below to reset your password:</p><a href="${url}">${url}</a>`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true, // fires automatically right after sign-up
    sendVerificationEmail: async ({ user, url }) => {
      await resend.emails.send({
        from: "Trackr <onboarding@resend.dev>",
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click below to verify your email:</p><a href="${url}">${url}</a>`,
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
