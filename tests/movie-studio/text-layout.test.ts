import { wrapCaptionText, wrapTextByEstimatedWidth } from "../../src/movie-studio/render/text-layout";

describe("wrapCaptionText", () => {
  test("wraps long lines by the specified width", () => {
    expect(wrapCaptionText("あいうえおかきくけこ", 4)).toBe("あいうえ\nおかきく\nけこ");
  });

  test("preserves explicit line breaks before wrapping", () => {
    expect(wrapCaptionText("あいうえお\nかきくけこ", 3)).toBe("あいう\nえお\nかきく\nけこ");
  });

  test("wraps mixed full-width and half-width text by estimated width", () => {
    expect(wrapTextByEstimatedWidth("ABCあいうDEFえお", 4)).toBe("ABCあ\nいうDEF\nえお");
  });
});
