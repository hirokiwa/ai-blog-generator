import { assertPublishedOnCurrentDay, getDayKeyInTimeZone } from "../../src/movie-studio/shared/date";

describe("getDayKeyInTimeZone", () => {
  test("formats a JST day key", () => {
    expect(getDayKeyInTimeZone(new Date("2026-04-02T10:00:00.000Z"), "Asia/Tokyo")).toBe("20260402");
  });
});

describe("assertPublishedOnCurrentDay", () => {
  test("does not throw when publishedAt is today in JST", () => {
    expect(() => {
      assertPublishedOnCurrentDay(
        new Date("2026-04-02T10:00:00.000Z"),
        new Date("2026-04-02T12:00:00.000Z"),
        "Asia/Tokyo",
      );
    }).not.toThrow();
  });

  test("throws when publishedAt is not today in JST", () => {
    expect(() => {
      assertPublishedOnCurrentDay(
        new Date("2026-04-01T10:00:00.000Z"),
        new Date("2026-04-02T12:00:00.000Z"),
        "Asia/Tokyo",
      );
    }).toThrow("Latest blog publishedAt is not today");
  });
});
