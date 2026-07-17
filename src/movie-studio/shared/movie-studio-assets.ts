import { access, copyFile, writeFile } from "fs/promises";
import { join } from "path";
import { MovieStudioError } from "./errors";
import { ensureDirectory } from "./file-system";
import type { MovieStudioAssets } from "./types";

interface BundledMovieStudioAssetSource {
  type: "bundled";
  sourceFilePath: string;
}

interface RemoteMovieStudioAssetSource {
  type: "remote";
  url: string;
}

type MovieStudioAssetSource = BundledMovieStudioAssetSource | RemoteMovieStudioAssetSource;

interface MovieStudioAssetDefinition {
  outputFileName: string;
  source: MovieStudioAssetSource;
}

type MovieStudioAssetDefinitions = {
  [Property in keyof MovieStudioAssets]: MovieStudioAssetDefinition;
};

const getBundledAssetFilePath = (...relativePathParts: string[]): string => {
  return join(process.cwd(), ...relativePathParts);
};

export const movieStudioAssetDefinitions: MovieStudioAssetDefinitions = {
  ojisanImageFilePath: {
    outputFileName: "ojisan.png",
    source: {
      type: "bundled",
      sourceFilePath: getBundledAssetFilePath("src", "assets", "ojisan-stanging.png"),
    },
  },
  shortThumbnailSourceImageFilePath: {
    outputFileName: "short-thumbnail-source.png",
    source: {
      type: "remote",
      url: "https://ai-blog.hirokiwa.com/top-image.png",
    },
  },
};

const downloadFile = async (url: string, outputFilePath: string): Promise<void> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new MovieStudioError(`Failed to download asset. url=${url} status=${String(response.status)}`);
  }

  const fileBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputFilePath, fileBuffer);
};

const prepareBundledAsset = async (
  sourceFilePath: string,
  outputFilePath: string,
): Promise<void> => {
  try {
    await access(sourceFilePath);
  } catch {
    throw new MovieStudioError(`Bundled asset was not found. path=${sourceFilePath}`);
  }

  await copyFile(sourceFilePath, outputFilePath);
};

const prepareAsset = async (
  assetDefinition: MovieStudioAssetDefinition,
  outputFilePath: string,
): Promise<void> => {
  if (assetDefinition.source.type === "bundled") {
    await prepareBundledAsset(assetDefinition.source.sourceFilePath, outputFilePath);
    return;
  }

  await downloadFile(assetDefinition.source.url, outputFilePath);
};

export const prepareMovieStudioAssets = async (
  assetsDirectoryPath: string,
): Promise<MovieStudioAssets> => {
  await ensureDirectory(assetsDirectoryPath);

  const resolvedAssetFilePaths = {
    ojisanImageFilePath: join(assetsDirectoryPath, movieStudioAssetDefinitions.ojisanImageFilePath.outputFileName),
    shortThumbnailSourceImageFilePath: join(
      assetsDirectoryPath,
      movieStudioAssetDefinitions.shortThumbnailSourceImageFilePath.outputFileName,
    ),
  } satisfies MovieStudioAssets;

  await Promise.all([
    prepareAsset(
      movieStudioAssetDefinitions.ojisanImageFilePath,
      resolvedAssetFilePaths.ojisanImageFilePath,
    ),
    prepareAsset(
      movieStudioAssetDefinitions.shortThumbnailSourceImageFilePath,
      resolvedAssetFilePaths.shortThumbnailSourceImageFilePath,
    ),
  ]);

  return resolvedAssetFilePaths;
};
