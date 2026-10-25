import { describe, expect, it } from "vitest";
import { maskIdNumber } from "../../lib/prearrival/mask";

describe("maskIdNumber", () => {
  it("shows only the last four characters", () => {
    expect(maskIdNumber("PT998877")).toBe("\u2022\u2022\u2022\u20228877");
  });

  it("leaves a value of four characters or fewer untouched", () => {
    expect(maskIdNumber("1234")).toBe("1234");
    expect(maskIdNumber("")).toBe("");
  });

  it("ignores surrounding whitespace", () => {
    expect(maskIdNumber("  AB123456  ")).toBe("\u2022\u2022\u2022\u20223456");
  });
});
