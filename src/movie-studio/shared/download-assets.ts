import { writeFile } from "fs/promises";
import { join } from "path";
import { ensureDirectory } from "./file-system";
import type { MovieStudioAssets } from "./types";
import { MovieStudioError } from "./errors";

const downloadFile = async (url: string, outputFilePath: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new MovieStudioError(`Failed to download asset. url=${url} status=${String(response.status)}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputFilePath, fileBuffer);
};

export const downloadMovieStudioAssets = async (
  assetsDirectoryPath: string,
): Promise<MovieStudioAssets> => {
  await ensureDirectory(assetsDirectoryPath);

  const ojisanImageFilePath = join(assetsDirectoryPath, "ojisan.svg");
  const shortThumbnailSourceImageFilePath = join(assetsDirectoryPath, "short-thumbnail-source.png");

  await downloadFile("https://ai-blog.hirokiwa.com/favicon.svg", ojisanImageFilePath);
  await downloadFile("https://ai-blog.hirokiwa.com/top-image.png", shortThumbnailSourceImageFilePath);

  return {
    ojisanImageFilePath,
    shortThumbnailSourceImageFilePath,
  };
};
