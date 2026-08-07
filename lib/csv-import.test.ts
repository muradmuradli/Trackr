import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseJobsCsv } from "@/lib/csv-import";
import { toCsv } from "@/lib/csv";
import { SOURCE_LABELS, STATUS_LABELS } from "@/lib/application";

const HEADER =
  "Company,Role,Status,Applied Date,Source,Salary Min,Salary Max,Job URL,Notes";

describe("parseJobsCsv", () => {
  it("parses a well-formed row using canonical enum values", () => {
    const { jobs, skipped } = parseJobsCsv(
      `${HEADER}\nStripe,Frontend Engineer,applied,2026-07-01,linkedin,90000,120000,https://stripe.com/jobs,Referred by a friend`,
    );

    expect(skipped).toBe(0);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      companyName: "Stripe",
      roleTitle: "Frontend Engineer",
      status: "applied",
      source: "linkedin",
      salaryMin: 90000,
      salaryMax: 120000,
      jobUrl: "https://stripe.com/jobs",
      notes: "Referred by a friend",
    });
    expect(jobs[0].date.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("matches status and source by their display label, case-insensitively", () => {
    const { jobs } = parseJobsCsv(
      `${HEADER}\nVercel,Full Stack Developer,Interview,2026-07-03,Company Website,,,,`,
    );

    expect(jobs[0].status).toBe("interview");
    expect(jobs[0].source).toBe("company_website");
  });

  it("recognizes every documented status and source label", () => {
    for (const { value, label } of [
      { value: "saved", label: STATUS_LABELS.saved },
      { value: "applied", label: STATUS_LABELS.applied },
      { value: "interview", label: STATUS_LABELS.interview },
      { value: "offer", label: STATUS_LABELS.offer },
      { value: "rejected", label: STATUS_LABELS.rejected },
      { value: "withdrawn", label: STATUS_LABELS.withdrawn },
    ]) {
      const { jobs } = parseJobsCsv(`${HEADER}\nAcme,Role,${label},,,,,,`);
      expect(jobs[0].status).toBe(value);
    }

    for (const { value, label } of [
      { value: "linkedin", label: SOURCE_LABELS.linkedin },
      { value: "company_website", label: SOURCE_LABELS.company_website },
      { value: "other", label: SOURCE_LABELS.other },
    ]) {
      const { jobs } = parseJobsCsv(`${HEADER}\nAcme,Role,,,${label},,,,`);
      expect(jobs[0].source).toBe(value);
    }
  });

  it("defaults status to saved and source to other when blank or unrecognized", () => {
    const blank = parseJobsCsv(`${HEADER}\nAcme,Role,,,,,,,`);
    expect(blank.jobs[0].status).toBe("saved");
    expect(blank.jobs[0].source).toBe("other");

    const garbage = parseJobsCsv(
      `${HEADER}\nAcme,Role,not-a-status,,not-a-source,,,,`,
    );
    expect(garbage.jobs[0].status).toBe("saved");
    expect(garbage.jobs[0].source).toBe("other");
  });

  it("strips currency symbols and thousands separators from salary", () => {
    const { jobs } = parseJobsCsv(
      `${HEADER}\nAcme,Role,,,,"$90,000","$120,000.50",,`,
    );

    expect(jobs[0].salaryMin).toBe(90000);
    expect(jobs[0].salaryMax).toBe(120000.5);
  });

  it("drops non-positive or unparseable salary values", () => {
    const { jobs } = parseJobsCsv(
      `${HEADER}\nAcme,Role,,,,0,-500,,\nAcme,Role,,,,abc,,,`,
    );

    expect(jobs[0].salaryMin).toBeUndefined();
    expect(jobs[0].salaryMax).toBeUndefined();
    expect(jobs[1].salaryMin).toBeUndefined();
  });

  it("drops an invalid job URL but keeps a valid one", () => {
    const { jobs } = parseJobsCsv(
      `${HEADER}\nAcme,Role,,,,,,not a url,\nAcme,Role,,,,,,https://acme.com/job,`,
    );

    expect(jobs[0].jobUrl).toBeUndefined();
    expect(jobs[1].jobUrl).toBe("https://acme.com/job");
  });

  it("trims notes and treats a blank notes field as undefined", () => {
    const { jobs } = parseJobsCsv(
      `${HEADER}\nAcme,Role,,,,,,,  padded note  \nAcme,Role,,,,,,,`,
    );

    expect(jobs[0].notes).toBe("padded note");
    expect(jobs[1].notes).toBeUndefined();
  });

  it("skips rows missing a required field and counts them", () => {
    const { jobs, skipped } = parseJobsCsv(
      `${HEADER}\n,Missing Company,,,,,,,\nMissing Role,,,,,,,,\nAcme,Engineer,,,,,,,`,
    );

    expect(skipped).toBe(2);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].companyName).toBe("Acme");
  });

  it("silently ignores fully blank rows without counting them as skipped", () => {
    const { jobs, skipped } = parseJobsCsv(
      `${HEADER}\nAcme,Engineer,,,,,,,\n,,,,,,,,\n`,
    );

    expect(jobs).toHaveLength(1);
    expect(skipped).toBe(0);
  });

  it("recognizes header aliases case-insensitively", () => {
    const { jobs } = parseJobsCsv(
      "company,role,status,date,source,salary min,salary max,url,notes\nAcme,Engineer,applied,2026-01-01,other,,,https://acme.com,note",
    );

    expect(jobs[0]).toMatchObject({
      companyName: "Acme",
      roleTitle: "Engineer",
      status: "applied",
      jobUrl: "https://acme.com",
      notes: "note",
    });
  });

  it("ignores columns it doesn't recognize", () => {
    const { jobs } = parseJobsCsv(
      "Company,Role,Unknown Column\nAcme,Engineer,whatever",
    );

    expect(jobs).toHaveLength(1);
    expect(jobs[0].companyName).toBe("Acme");
  });

  it("returns no jobs and no skips for empty input", () => {
    expect(parseJobsCsv("")).toEqual({ jobs: [], skipped: 0 });
  });

  it("round-trips a file produced by the app's own CSV export", () => {
    const exportedCsv = toCsv(
      [
        {
          companyName: "Figma",
          roleTitle: "Frontend Engineer",
          status: "offer" as const,
          date: "2026-06-15",
          source: "company_website" as const,
          salaryMin: 110000,
          salaryMax: 150000,
          jobUrl: "https://figma.com/careers",
          notes: "Negotiating start date",
        },
      ],
      [
        { key: "companyName", label: "Company" },
        { key: "roleTitle", label: "Role" },
        { key: "status", label: "Status", format: (r) => STATUS_LABELS[r.status] },
        { key: "date", label: "Applied Date" },
        { key: "source", label: "Source", format: (r) => SOURCE_LABELS[r.source] },
        { key: "salaryMin", label: "Salary Min" },
        { key: "salaryMax", label: "Salary Max" },
        { key: "jobUrl", label: "Job URL" },
        { key: "notes", label: "Notes" },
      ],
    );

    const { jobs, skipped } = parseJobsCsv(exportedCsv);

    expect(skipped).toBe(0);
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      companyName: "Figma",
      roleTitle: "Frontend Engineer",
      status: "offer",
      source: "company_website",
      salaryMin: 110000,
      salaryMax: 150000,
      jobUrl: "https://figma.com/careers",
      notes: "Negotiating start date",
    });
  });

  describe("when the applied date is blank or unparseable", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-08-07T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("falls back to today", () => {
      const { jobs } = parseJobsCsv(`${HEADER}\nAcme,Role,,,,,,,`);
      expect(jobs[0].date.toISOString()).toBe("2026-08-07T12:00:00.000Z");

      const { jobs: garbageJobs } = parseJobsCsv(
        `${HEADER}\nAcme,Role,,not-a-date,,,,,`,
      );
      expect(garbageJobs[0].date.toISOString()).toBe(
        "2026-08-07T12:00:00.000Z",
      );
    });
  });
});
