import { mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";

export const ensureDirectory = async (directoryPath: string): Promise<void> => {
  await mkdir(directoryPath, { recursive: true });
};

export const writeJsonFile = async (
  filePath: string,
  value: unknown,
): Promise<void> => {
  await ensureDirectory(dirname(filePath));
  await writeFile(filePath, JSON.stringify(value, null, 2));
};

export const joinArtifactPath = (
  artifactDirectoryPath: string,
  ...relativePathParts: string[]
): string => {
  return join(artifactDirectoryPath, ...relativePathParts);
};
