import { access } from "fs/promises";
import { createHash } from "crypto";
import { join } from "path";
import { ensureDirectory } from "../shared/file-system";

export const createAudioCacheFilePath = (
  audioDirectoryPath: string,
  audioKey: string,
): string => {
  const audioHash = createHash("sha256").update(audioKey).digest("hex");
  return join(audioDirectoryPath, `${audioHash}.wav`);
};

export const audioFileExists = async (audioFilePath: string): Promise<boolean> => {
  try {
    await access(audioFilePath);
    return true;
  } catch {
    return false;
  }
};

export const ensureAudioDirectory = async (audioDirectoryPath: string): Promise<void> => {
  await ensureDirectory(audioDirectoryPath);
};
