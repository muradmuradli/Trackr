import { describe, expect, it } from "vitest";
import { cn, getInitials } from "@/lib/utils";

describe("getInitials", () => {
  it("returns the first letter of each of the first two words, uppercased", () => {
    expect(getInitials("Ada Lovelace")).toBe("AL");
  });

  it("returns a single letter for a one-word name", () => {
    expect(getInitials("Madonna")).toBe("M");
  });

  it("caps at two letters for names with more than two words", () => {
    expect(getInitials("Ada Augusta King Lovelace")).toBe("AA");
  });

  it("collapses repeated whitespace between words", () => {
    expect(getInitials("Ada   Lovelace")).toBe("AL");
  });

  it("trims leading and trailing whitespace", () => {
    expect(getInitials("  Ada Lovelace  ")).toBe("AL");
  });

  it("returns an empty string for undefined or empty input", () => {
    expect(getInitials(undefined)).toBe("");
    expect(getInitials("")).toBe("");
  });
});

describe("cn", () => {
  it("joins class names and drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves conflicting Tailwind utility classes to the last one", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
