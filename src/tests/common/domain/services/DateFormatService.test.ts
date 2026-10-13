import { describe, expect, it } from "vitest";
import { formatDateTime } from "../../../../common/domain/services/DateFormatService";

describe("DateFormatService", () => {
  it("formats as dd.MM.yyyy HH:mm with zero padding in local time", () => {
    const local = new Date(2026, 7, 4, 9, 5);

    expect(formatDateTime(local.toISOString())).toBe("04.08.2026 09:05");
  });

  it("returns an empty string for an unparseable timestamp", () => {
    expect(formatDateTime("not-a-date")).toBe("");
  });
});
