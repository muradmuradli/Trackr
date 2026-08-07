import { BrevoClient } from "@getbrevo/brevo";

export const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!,
});

export const EMAIL_SENDER = { name: "Trackr", email: "muradlu110@gmail.com" };
