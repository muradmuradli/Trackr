import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const statusEnum = pgEnum("status", [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
]);

export const sourceEnum = pgEnum("source", [
  "linkedin",
  "company_website",
  "other",
]);

export const jobApplications = pgTable("job_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  companyName: text("company_name").notNull(),
  roleTitle: text("role_title").notNull(),
  jobUrl: text("job_url"),
  status: statusEnum("status").notNull().default("saved"),
  date: timestamp("date").notNull(),
  source: sourceEnum("source").notNull(),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  notes: text("notes"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
