import { getDayKeyInTimeZone } from "../shared/date";
import type { MovieKind, NarrationSentence, VideoScript, VideoScriptSegment } from "../shared/types";
import { wrapTextByEstimatedWidth } from "../render/text-layout";

const mapNarrationSentenceToSegment = (
  narrationSentence: NarrationSentence,
): VideoScriptSegment => {
  return {
    id: narrationSentence.id,
    speechText: narrationSentence.speechText,
    captionText: narrationSentence.captionText,
    audioKey: narrationSentence.speechText,
  };
};

const buildHeaderText = (
  publishedAtIsoString: string,
  timeZone: string,
  blogTitle: string,
): string => {
  return `関西弁でお届けする AI おじさん毎日ブログ  #${getDayKeyInTimeZone(new Date(publishedAtIsoString), timeZone)}\n『${wrapTextByEstimatedWidth(blogTitle, 22)}』`;
};

const buildLongVideoScript = (
  headerText: string,
  narrationSentences: NarrationSentence[],
): VideoScript => {
  return {
    kind: "long",
    dimensions: { width: 1920, height: 1080 },
    captionLayout: {
      fontSize: 52,
      maxCharactersPerLine: 24,
      bottomMargin: 78,
      lineSpacing: 18,
      boxWidth: 1520,
    },
    headerText,
    headerFontSize: 36,
    imageScaleWidth: 360,
    segments: [
      ...narrationSentences.map(mapNarrationSentenceToSegment),
      {
        id: "ending-card",
        captionText: "関西弁でお届けする AI おじさん毎日ブログ",
        durationSeconds: 10,
      },
    ],
  };
};

const buildShortVideoScript = (
  headerText: string,
  narrationSentences: NarrationSentence[],
): VideoScript => {
  return {
    kind: "short",
    dimensions: { width: 1080, height: 1920 },
    captionLayout: {
      fontSize: 56,
      maxCharactersPerLine: 14,
      bottomMargin: 560,
      lineSpacing: 20,
      boxWidth: 920,
    },
    headerText,
    headerFontSize: 34,
    imageScaleWidth: 460,
    segments: [
      ...narrationSentences.map(mapNarrationSentenceToSegment),
      {
        id: "short-outro-line-1",
        speechText: "続きはブログで",
        captionText: "続きはブログで...",
        audioKey: "続きはブログで",
      },
      {
        id: "short-outro-line-2",
        speechText: "AIおじさん毎日ブログで検索",
        captionText: "「AI おじさん毎日ブログ」で検索",
        audioKey: "AIおじさん毎日ブログで検索",
      },
    ],
  };
};

export const buildVideoScripts = (
  publishedAtIsoString: string,
  timeZone: string,
  blogTitle: string,
  longNarrationSentences: NarrationSentence[],
  shortNarrationSentences: NarrationSentence[],
): { headerText: string; scripts: Record<MovieKind, VideoScript> } => {
  const headerText = buildHeaderText(publishedAtIsoString, timeZone, blogTitle);

  return {
    headerText,
    scripts: {
      long: buildLongVideoScript(headerText, longNarrationSentences),
      short: buildShortVideoScript(headerText, shortNarrationSentences),
    },
  };
};
