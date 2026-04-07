import type { VideoScript } from "../shared/types";

const calculateCharacterWidthUnits = (character: string): number => {
  if (/[\u0020]/u.test(character)) {
    return 0.4;
  }

  if (/[\u0000-\u007f]/u.test(character)) {
    if (/[A-Z0-9]/u.test(character)) {
      return 0.72;
    }

    if (/[a-z]/u.test(character)) {
      return 0.62;
    }

    return 0.5;
  }

  if (/[\uff61-\uff9f]/u.test(character)) {
    return 0.65;
  }

  if (/[、。，．・：；！？]/u.test(character)) {
    return 0.6;
  }

  return 1;
};

export const wrapTextByEstimatedWidth = (
  text: string,
  maxWidthUnitsPerLine: number,
): string => {
  const lines: string[] = [];

  for (const paragraph of text.split(/\r?\n/)) {
    const characters = [...paragraph];

    if (characters.length === 0) {
      lines.push("");
      continue;
    }

    let currentLine = "";
    let currentLineWidth = 0;

    for (const character of characters) {
      const nextCharacterWidth = calculateCharacterWidthUnits(character);

      if (currentLine.length > 0 && currentLineWidth + nextCharacterWidth > maxWidthUnitsPerLine) {
        lines.push(currentLine);
        currentLine = character;
        currentLineWidth = nextCharacterWidth;
        continue;
      }

      currentLine += character;
      currentLineWidth += nextCharacterWidth;
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  return lines.join("\n");
};

export const wrapCaptionText = (
  text: string,
  maxCharactersPerLine: number,
): string => {
  return wrapTextByEstimatedWidth(text, maxCharactersPerLine);
};

export const buildCaptionText = (
  script: VideoScript,
  captionText: string,
): string => {
  return wrapCaptionText(captionText, script.captionLayout.maxCharactersPerLine);
};
