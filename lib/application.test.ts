import { describe, expect, it } from "vitest";
import {
  SOURCE_LABELS,
  SOURCE_OPTIONS,
  STATUS_BADGE_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABELS,
  STATUS_OPTIONS,
} from "@/lib/application";
import { statusEnum, sourceEnum } from "@/db/schema";

describe("application status/source option tables", () => {
  it("STATUS_LABELS has exactly one entry per STATUS_OPTIONS value", () => {
    const optionValues = STATUS_OPTIONS.map((option) => option.value).sort();
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(optionValues);
  });

  it("SOURCE_LABELS has exactly one entry per SOURCE_OPTIONS value", () => {
    const optionValues = SOURCE_OPTIONS.map((option) => option.value).sort();
    expect(Object.keys(SOURCE_LABELS).sort()).toEqual(optionValues);
  });

  it("every status has a badge class and a dot class", () => {
    for (const { value } of STATUS_OPTIONS) {
      expect(STATUS_BADGE_CLASSES[value]).toBeTruthy();
      expect(STATUS_DOT_CLASSES[value]).toBeTruthy();
    }
  });

  it("every badge class pairs a light-mode and a dark-mode class", () => {
    for (const className of Object.values(STATUS_BADGE_CLASSES)) {
      expect(className).toMatch(/\bbg-\S+/);
      expect(className).toMatch(/\btext-\S+/);
      expect(className).toMatch(/dark:bg-\S+/);
      expect(className).toMatch(/dark:text-\S+/);
    }
  });

  it("labels are non-empty and distinct within each set", () => {
    const statusLabels = Object.values(STATUS_LABELS);
    expect(new Set(statusLabels).size).toBe(statusLabels.length);
    expect(statusLabels.every((label) => label.trim().length > 0)).toBe(true);

    const sourceLabels = Object.values(SOURCE_LABELS);
    expect(new Set(sourceLabels).size).toBe(sourceLabels.length);
  });

  // Guards against the exact kind of drift this app has hit before: the
  // status/source enums are duplicated across db/schema.ts, the tRPC router,
  // and this file, and nothing forces them to stay in sync automatically.
  it("matches the database's status and source enum values exactly", () => {
    expect(STATUS_OPTIONS.map((o) => o.value).sort()).toEqual(
      [...statusEnum.enumValues].sort(),
    );
    expect(SOURCE_OPTIONS.map((o) => o.value).sort()).toEqual(
      [...sourceEnum.enumValues].sort(),
    );
  });
});
