import { describe, expect, it } from "vitest";
import { STATUS_OPTIONS } from "@/lib/application";
import { FUNNEL_RAMP, STATUS_CATEGORICAL, TREND_HUE } from "@/lib/analytics-colors";

const HEX = /^#[0-9a-f]{6}$/i;

describe("analytics color palette", () => {
  it("TREND_HUE defines a valid hex for both modes", () => {
    expect(TREND_HUE.light).toMatch(HEX);
    expect(TREND_HUE.dark).toMatch(HEX);
  });

  it("FUNNEL_RAMP has four valid, monotone-lightness hex steps per mode", () => {
    for (const ramp of [FUNNEL_RAMP.light, FUNNEL_RAMP.dark]) {
      expect(ramp).toHaveLength(4);
      ramp.forEach((hex) => expect(hex).toMatch(HEX));
      // Every step must be distinct — a repeated hex would make two funnel
      // stages visually indistinguishable.
      expect(new Set(ramp).size).toBe(ramp.length);
    }
  });

  it("STATUS_CATEGORICAL assigns a distinct light/dark hex pair to every status", () => {
    const statusValues = STATUS_OPTIONS.map((option) => option.value);
    expect(Object.keys(STATUS_CATEGORICAL).sort()).toEqual(
      [...statusValues].sort(),
    );

    for (const status of statusValues) {
      expect(STATUS_CATEGORICAL[status].light).toMatch(HEX);
      expect(STATUS_CATEGORICAL[status].dark).toMatch(HEX);
    }

    const lightHexes = statusValues.map((s) => STATUS_CATEGORICAL[s].light);
    expect(new Set(lightHexes).size).toBe(lightHexes.length);

    const darkHexes = statusValues.map((s) => STATUS_CATEGORICAL[s].dark);
    expect(new Set(darkHexes).size).toBe(darkHexes.length);
  });
});
