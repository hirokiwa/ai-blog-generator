import { execFileAsync, escapeDrawtextText } from "../render/ffmpeg";

const ffmpegFontFilePath = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc";

export const renderShortThumbnail = async ({
  sourceImageFilePath,
  outputFilePath,
  title,
  dayKey,
}: {
  sourceImageFilePath: string;
  outputFilePath: string;
  title: string;
  dayKey: string;
}): Promise<void> => {
  const filterComplex = [
    `[0:v]scale=1080:1920[bg]`,
    `[1:v]scale=920:-1[top]`,
    `[bg][top]overlay=(W-w)/2:(H-h)/2-120`,
    `drawtext=fontfile=${ffmpegFontFilePath}:text='${escapeDrawtextText(title)}':fontcolor=white:fontsize=68:box=1:boxcolor=black@0.6:boxborderw=30:x=(w-text_w)/2:y=220`,
    `drawtext=fontfile=${ffmpegFontFilePath}:text='#${escapeDrawtextText(dayKey)}':fontcolor=white:fontsize=52:x=w-text_w-90:y=1540`,
  ].join(",");

  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=1080x1920",
    "-loop",
    "1",
    "-i",
    sourceImageFilePath,
    "-frames:v",
    "1",
    "-filter_complex",
    filterComplex,
    outputFilePath,
  ]);
};

export const renderLongThumbnail = async ({
  ojisanImageFilePath,
  outputFilePath,
  title,
  headerText,
}: {
  ojisanImageFilePath: string;
  outputFilePath: string;
  title: string;
  headerText: string;
}): Promise<void> => {
  const filterComplex = [
    `[0:v]scale=1280:720[bg]`,
    `[1:v]scale=260:-1[ojisan]`,
    `[bg][ojisan]overlay=(W-w)/2:160`,
    `drawtext=fontfile=${ffmpegFontFilePath}:text='${escapeDrawtextText(headerText)}':fontcolor=black:fontsize=22:x=40:y=40`,
    `drawtext=fontfile=${ffmpegFontFilePath}:text='${escapeDrawtextText(title)}':fontcolor=black:fontsize=54:box=1:boxcolor=white@0.75:boxborderw=26:x=(w-text_w)/2:y=470`,
  ].join(",");

  await execFileAsync("ffmpeg", [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=white:s=1280x720",
    "-loop",
    "1",
    "-i",
    ojisanImageFilePath,
    "-frames:v",
    "1",
    "-filter_complex",
    filterComplex,
    outputFilePath,
  ]);
};
