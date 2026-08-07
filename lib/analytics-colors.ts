import type { ApplicationStatus } from "@/lib/application";

// Validated against scripts/validate_palette.js (dataviz skill) — do not
// hand-edit without re-running the validator for both modes.

export const TREND_HUE = { light: "#2a78d6", dark: "#3987e5" };

// One hue, monotone lightness — funnel stage is ordinal, not identity.
export const FUNNEL_RAMP = {
  light: ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"],
  dark: ["#b7d3f6", "#86b6ef", "#5598e7", "#2a78d6"],
};

// Fixed categorical order (never cycled), assigned once to the pipeline's
// natural stage order: saved, applied, interview, offer, rejected, withdrawn.
export const STATUS_CATEGORICAL: Record<
  ApplicationStatus,
  { light: string; dark: string }
> = {
  saved: { light: "#2a78d6", dark: "#3987e5" },
  applied: { light: "#eb6834", dark: "#d95926" },
  interview: { light: "#1baf7a", dark: "#199e70" },
  offer: { light: "#eda100", dark: "#c98500" },
  rejected: { light: "#e87ba4", dark: "#d55181" },
  withdrawn: { light: "#008300", dark: "#008300" },
};
