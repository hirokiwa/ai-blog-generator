import { rm, writeFile } from "fs/promises";
import { join } from "path";
import type { VideoScript } from "../shared/types";
import { execFileAsync, escapeDrawtextText } from "./ffmpeg";
import { buildCaptionText } from "./text-layout";

const ffmpegFontFilePath = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";
const voicevoxAudioSampleRate = 24000;
const voicevoxAudioChannelLayout = "mono";

export interface TimedCaptionSegment {
  id: string;
  captionText: string;
  startSeconds: number;
  endSeconds: number;
}

interface CaptionRenderEntry {
  timedSegment: TimedCaptionSegment;
  captionTextFilePath: string;
}

const formatTimestampSeconds = (seconds: number): string => {
  return seconds.toFixed(3);
};

const buildCaptionYExpression = (script: VideoScript): string => {
  if (script.kind === "short") {
    return `${String(script.captionLayout.bottomMargin)}-text_h/2`;
  }

  return `h-text_h-${String(script.captionLayout.bottomMargin)}`;
};

const buildOjisanOverlayXExpression = (script: VideoScript): string => {
  return `(W-w)/2${script.imageLayout.offsetX >= 0 ? "+" : ""}${String(script.imageLayout.offsetX)}`;
};

const buildOjisanOverlayYExpression = (script: VideoScript): string => {
  return `(H-h)/2${script.imageLayout.offsetY >= 0 ? "+" : ""}${String(script.imageLayout.offsetY)}`;
};

const createHeaderDrawtextFilter = (
  script: VideoScript,
  headerTextFilePath: string,
): string => {
  return `drawtext=fontfile=${ffmpegFontFilePath}:textfile='${escapeDrawtextText(headerTextFilePath)}':expansion=none:fontcolor=white:fontsize=${String(script.headerFontSize)}:x=40:y=40`;
};

const createCaptionDrawtextFilter = (
  script: VideoScript,
  captionTextFilePath: string,
  startSeconds: number,
  endSeconds: number,
): string => {
  return `drawtext=fontfile=${ffmpegFontFilePath}:textfile='${escapeDrawtextText(captionTextFilePath)}':expansion=none:fontcolor=white:fontsize=${String(script.captionLayout.fontSize)}:line_spacing=${String(script.captionLayout.lineSpacing)}:box=1:boxcolor=black@0.75:boxborderw=28:x=(w-text_w)/2:y=${buildCaptionYExpression(script)}:enable='between(t,${formatTimestampSeconds(startSeconds)},${formatTimestampSeconds(endSeconds)})'`;
};

const buildMovieFilterComplex = (
  script: VideoScript,
  headerTextFilePath: string,
  captionRenderEntries: CaptionRenderEntry[],
): string => {
  const filterSteps = [
    `[0:v]scale=${String(script.dimensions.width)}:${String(script.dimensions.height)}[bg]`,
    `[1:v]scale=${String(script.imageLayout.scaleWidth)}:-1[ojisan]`,
    `[bg][ojisan]overlay=${buildOjisanOverlayXExpression(script)}:${buildOjisanOverlayYExpression(script)}[base]`,
    `[base]${createHeaderDrawtextFilter(script, headerTextFilePath)}[caption_0]`,
  ];

  captionRenderEntries.forEach(({ timedSegment, captionTextFilePath }, segmentIndex) => {
    filterSteps.push(
      `[caption_${String(segmentIndex)}]${createCaptionDrawtextFilter(
        script,
        captionTextFilePath,
        timedSegment.startSeconds,
        timedSegment.endSeconds,
      )}[caption_${String(segmentIndex + 1)}]`,
    );
  });

  return filterSteps.join(";");
};

export const renderMovieVideo = async ({
  script,
  timedSegments,
  imageFilePath,
  outputFilePath,
  temporaryDirectoryPath,
  totalDurationSeconds,
}: {
  script: VideoScript;
  timedSegments: TimedCaptionSegment[];
  imageFilePath: string;
  outputFilePath: string;
  temporaryDirectoryPath: string;
  totalDurationSeconds: number;
}): Promise<void> => {
  const headerTextFilePath = join(temporaryDirectoryPath, `${script.kind}-header.txt`);
  const captionRenderEntries = timedSegments.map((timedSegment, segmentIndex) => {
    return {
      timedSegment,
      captionTextFilePath: join(
        temporaryDirectoryPath,
        `${script.kind}-${String(segmentIndex + 1).padStart(3, "0")}-${timedSegment.id}.txt`,
      ),
    };
  });

  await writeFile(headerTextFilePath, script.headerText);
  await Promise.all(captionRenderEntries.map(async ({ timedSegment, captionTextFilePath }) => {
    await writeFile(
      captionTextFilePath,
      buildCaptionText(script, timedSegment.captionText),
    );
  }));

  try {
    const filterComplex = buildMovieFilterComplex(
      script,
      headerTextFilePath,
      captionRenderEntries,
    );

    await execFileAsync("ffmpeg", [
      "-y",
      "-f",
      "lavfi",
      "-i",
      `color=c=black:s=${String(script.dimensions.width)}x${String(script.dimensions.height)}`,
      "-loop",
      "1",
      "-i",
      imageFilePath,
      "-filter_complex",
      filterComplex,
      "-map",
      `[caption_${String(timedSegments.length)}]`,
      "-t",
      String(totalDurationSeconds),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-an",
      outputFilePath,
    ]);
  } finally {
    await rm(headerTextFilePath, { force: true });
    await Promise.all(captionRenderEntries.map(async ({ captionTextFilePath }) => {
      await rm(captionTextFilePath, { force: true });
    }));
  }
};

export const createSilentAudioClip = async (
  outputFilePath: string,
  durationSeconds: number,
): Promise<void> => {
  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `anullsrc=r=${String(voicevoxAudioSampleRate)}:cl=${voicevoxAudioChannelLayout}`,
    "-t",
    String(durationSeconds),
    "-c:a",
    "pcm_s16le",
    outputFilePath,
  ]);
};

export const createConcatListFile = async (
  concatListFilePath: string,
  clipFilePaths: string[],
): Promise<void> => {
  const concatList = clipFilePaths.map((clipFilePath) => `file '${clipFilePath}'`).join("\n");
  await writeFile(concatListFilePath, concatList);
};

export const concatenateAudioClips = async (
  concatListFilePath: string,
  outputFilePath: string,
): Promise<void> => {
  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    concatListFilePath,
    "-c:a",
    "pcm_s16le",
    outputFilePath,
  ]);
};

export const muxVideoAndAudio = async (
  videoFilePath: string,
  audioFilePath: string,
  outputFilePath: string,
  totalDurationSeconds: number,
): Promise<void> => {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    videoFilePath,
    "-i",
    audioFilePath,
    "-map",
    "0:v:0",
    "-map",
    "1:a:0",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-af",
    "apad",
    "-t",
    String(totalDurationSeconds),
    "-movflags",
    "+faststart",
    outputFilePath,
  ]);
};
