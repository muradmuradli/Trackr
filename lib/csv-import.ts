import {
  SOURCE_OPTIONS,
  STATUS_OPTIONS,
  type ApplicationSource,
  type ApplicationStatus,
} from "@/lib/application";
import { parseCsv } from "@/lib/csv";

export type ImportedJob = {
  companyName: string;
  roleTitle: string;
  jobUrl?: string;
  status: ApplicationStatus;
  date: Date;
  source: ApplicationSource;
  salaryMin?: number;
  salaryMax?: number;
  notes?: string;
};

type RawRow = {
  companyName: string;
  roleTitle: string;
  status: string;
  date: string;
  source: string;
  salaryMin: string;
  salaryMax: string;
  jobUrl: string;
  notes: string;
};

function emptyRow(): RawRow {
  return {
    companyName: "",
    roleTitle: "",
    status: "",
    date: "",
    source: "",
    salaryMin: "",
    salaryMax: "",
    jobUrl: "",
    notes: "",
  };
}

// Matches the headers produced by the CSV export, case-insensitively, plus a
// couple of common alternates — this is not meant to fuzzy-match arbitrary
// third-party exports, just round-trip our own and tolerate a hand-edited file.
const HEADER_ALIASES: Record<string, keyof RawRow> = {
  company: "companyName",
  "company name": "companyName",
  role: "roleTitle",
  "role title": "roleTitle",
  status: "status",
  date: "date",
  "applied date": "date",
  source: "source",
  "salary min": "salaryMin",
  "salary max": "salaryMax",
  "job url": "jobUrl",
  url: "jobUrl",
  notes: "notes",
};

const STATUS_VALUES = new Set(STATUS_OPTIONS.map((option) => option.value));
const STATUS_BY_LABEL = new Map(
  STATUS_OPTIONS.map((option) => [option.label.toLowerCase(), option.value]),
);

const SOURCE_VALUES = new Set(SOURCE_OPTIONS.map((option) => option.value));
const SOURCE_BY_LABEL = new Map(
  SOURCE_OPTIONS.map((option) => [option.label.toLowerCase(), option.value]),
);

function parseStatus(raw: string): ApplicationStatus {
  const value = raw.trim().toLowerCase();
  if (!value) return "saved";
  if (STATUS_VALUES.has(value as ApplicationStatus)) {
    return value as ApplicationStatus;
  }
  return STATUS_BY_LABEL.get(value) ?? "saved";
}

function parseSource(raw: string): ApplicationSource {
  const value = raw.trim().toLowerCase();
  if (!value) return "other";
  if (SOURCE_VALUES.has(value as ApplicationSource)) {
    return value as ApplicationSource;
  }
  return SOURCE_BY_LABEL.get(value) ?? "other";
}

function parseDate(raw: string): Date {
  const trimmed = raw.trim();
  if (trimmed) {
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function parseSalary(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const value = Number(trimmed.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function parseUrl(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return undefined;
  }
}

// Company and role are the only truly required fields — everything else gets
// a sensible default so a hand-filled, partially-complete CSV still imports
// instead of being rejected outright.
export function parseJobsCsv(text: string): {
  jobs: ImportedJob[];
  skipped: number;
} {
  const rows = parseCsv(text);
  if (rows.length === 0) return { jobs: [], skipped: 0 };

  const [headerRow, ...dataRows] = rows;
  const fieldOrder = headerRow.map(
    (header) => HEADER_ALIASES[header.trim().toLowerCase()],
  );

  const jobs: ImportedJob[] = [];
  let skipped = 0;

  for (const row of dataRows) {
    if (row.every((cell) => cell.trim() === "")) continue;

    const raw = emptyRow();
    fieldOrder.forEach((field, index) => {
      if (field) raw[field] = row[index] ?? "";
    });

    const companyName = raw.companyName.trim();
    const roleTitle = raw.roleTitle.trim();
    if (!companyName || !roleTitle) {
      skipped += 1;
      continue;
    }

    jobs.push({
      companyName,
      roleTitle,
      jobUrl: parseUrl(raw.jobUrl),
      status: parseStatus(raw.status),
      date: parseDate(raw.date),
      source: parseSource(raw.source),
      salaryMin: parseSalary(raw.salaryMin),
      salaryMax: parseSalary(raw.salaryMax),
      notes: raw.notes.trim() || undefined,
    });
  }

  return { jobs, skipped };
}
