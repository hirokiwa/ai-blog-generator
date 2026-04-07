import { buildVideoScripts } from "../../src/movie-studio/script/build-video-scripts";
import { buildNarrationSentences, getShortNarrationSentences, splitIntoSentences } from "../../src/movie-studio/script/text";

describe("splitIntoSentences", () => {
  test("splits Japanese punctuation based sentences", () => {
    expect(splitIntoSentences("一文目です。二文目です！三文目です？")).toStrictEqual([
      "一文目です。",
      "二文目です！",
      "三文目です？",
    ]);
  });

  test("does not split on punctuation inside brackets", () => {
    expect(splitIntoSentences("一文目です。（補足です。まだ続きます。）二文目です。")).toStrictEqual([
      "一文目です。",
      "（補足です。まだ続きます。）二文目です。",
    ]);
  });

  test("keeps consecutive sentence-ending punctuation in the same sentence", () => {
    expect(splitIntoSentences("白菜98円！？えぐ安ッ！")).toStrictEqual([
      "白菜98円！？",
      "えぐ安ッ！",
    ]);
  });

  test("does not produce punctuation-only sentences", () => {
    expect(splitIntoSentences("ほんまか！？知らんけど！")).toStrictEqual([
      "ほんまか！？",
      "知らんけど！",
    ]);
  });
});

// describe("buildNarrationSentences", () => {
//   test("keeps separate speech and caption text", () => {
//     const narrationSentences = buildNarrationSentences({
//       id: "post-id",
//       title: "AIおじさんの話",
//       body: "AI おじさんが来た。",
//       publishedAt: "2026-04-02T10:00:00Z",
//     });

//     expect(narrationSentences[0]).toStrictEqual({
//       id: "title",
//       speechText: "エーアイおじさんの話",
//       captionText: "AI おじさんの話",
//     });
//     expect(narrationSentences[1]).toStrictEqual({
//       id: "body-001",
//       speechText: "エーアイおじさんが来た。",
//       captionText: "AI おじさんが来た。",
//     });
//   });
// });

describe("getShortNarrationSentences", () => {
  test("returns title and first ten body sentences", () => {
    const narrationSentences = buildNarrationSentences({
      id: "post-id",
      title: "タイトル",
      body: Array.from({ length: 12 }, (_, index) => `${String(index + 1)}文目です。`).join(""),
      publishedAt: "2026-04-02T10:00:00Z",
    });

    expect(getShortNarrationSentences(narrationSentences)).toHaveLength(11);
  });
});

describe("buildVideoScripts", () => {
  test("creates a dated header text", () => {
    const narrationSentences = buildNarrationSentences({
      id: "post-id",
      title: "タイトル",
      body: "本文です。",
      publishedAt: "2026-04-02T10:00:00Z",
    });

    const { headerText, scripts } = buildVideoScripts(
      "2026-04-02T10:00:00Z",
      "Asia/Tokyo",
      "タイトル",
      narrationSentences,
      getShortNarrationSentences(narrationSentences),
    );

    expect(headerText).toBe("関西弁でお届けする AI おじさん毎日ブログ  #20260402\n『タイトル』");
    expect(scripts.long.segments.at(-1)?.id).toBe("ending-card");
    expect(scripts.short.segments.at(-1)?.id).toBe("short-outro-line-2");
  });
});
