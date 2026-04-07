import { defaultShortSentenceLimit } from "../shared/constants";
import type { BlogVideoSource, NarrationSentence } from "../shared/types";

interface PronunciationRule {
  target: RegExp;
  speechReplacement: string;
  captionReplacement: string;
}

const pronunciationDictionary: PronunciationRule[] = [
  // {
  //   target: /AIおじさん/g,
  //   speechReplacement: "エーアイおじさん",
  //   captionReplacement: "AI おじさん",
  // },
  {
    target: /AI おじさん/g,
    speechReplacement: "AIおじさん",
    captionReplacement: "AI おじさん",
  },
];

const normalizeBodyText = (text: string): string => {
  return text.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
};

const openingBracketCharacters = new Set(["(", "（", "「", "『", "【", "［", "[", "〈", "《", "〔"]);
const closingBracketCharacters = new Set([")", "）", "」", "』", "】", "］", "]", "〉", "》", "〕"]);
const sentenceEndingCharacters = new Set(["。", "！", "？", "!", "?"]);
const isSentenceEndingCharacter = (character: string | undefined): boolean => {
  return character !== undefined && sentenceEndingCharacters.has(character);
};

export const splitIntoSentences = (body: string): string[] => {
  const normalizedBody = normalizeBodyText(body);
  const sentences: string[] = [];
  let currentSentence = "";
  let bracketDepth = 0;

  for (const [characterIndex, character] of [...normalizedBody].entries()) {
    currentSentence += character;

    if (openingBracketCharacters.has(character)) {
      bracketDepth += 1;
      continue;
    }

    if (closingBracketCharacters.has(character)) {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    const nextCharacter = normalizedBody.at(characterIndex + 1);
    const shouldContinueCurrentSentence = bracketDepth === 0
      && isSentenceEndingCharacter(character)
      && isSentenceEndingCharacter(nextCharacter);

    if (shouldContinueCurrentSentence) {
      continue;
    }

    if (bracketDepth === 0 && sentenceEndingCharacters.has(character)) {
      sentences.push(currentSentence.trim());
      currentSentence = "";
    }
  }

  if (currentSentence.trim().length > 0) {
    sentences.push(currentSentence.trim());
  }

  return sentences;
};

export const buildNarrationSentence = (
  sentenceId: string,
  originalText: string,
): NarrationSentence => {
  const transformedSentence = pronunciationDictionary.reduce(
    (currentSentence, rule) => {
      return {
        speechText: currentSentence.speechText.replace(rule.target, rule.speechReplacement),
        captionText: currentSentence.captionText.replace(rule.target, rule.captionReplacement),
      };
    },
    {
      speechText: originalText,
      captionText: originalText,
    },
  );

  return {
    id: sentenceId,
    speechText: transformedSentence.speechText,
    captionText: transformedSentence.captionText,
  };
};

export const buildNarrationSentences = (blog: BlogVideoSource): NarrationSentence[] => {
  const bodySentences = splitIntoSentences(blog.body).map((sentence, index) => {
    return buildNarrationSentence(`body-${String(index + 1).padStart(3, "0")}`, sentence);
  });

  return [buildNarrationSentence("title", blog.title), ...bodySentences];
};

export const getShortNarrationSentences = (
  narrationSentences: NarrationSentence[],
): NarrationSentence[] => {
  const titleSentence = narrationSentences[0];
  const bodySentences = narrationSentences.slice(1, defaultShortSentenceLimit + 1);
  return titleSentence === undefined ? bodySentences : [titleSentence, ...bodySentences];
};
