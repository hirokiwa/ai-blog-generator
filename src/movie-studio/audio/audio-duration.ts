import { execFile } from "child_process";

const execFileAsync = async (
  command: string,
  argumentsList: string[],
): Promise<string> => {
  return await new Promise((resolve, reject) => {
    execFile(command, argumentsList, (error, stdout) => {
      if (error !== null) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
};

export const getAudioDurationSeconds = async (
  audioFilePath: string,
): Promise<number> => {
  const durationText = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    audioFilePath,
  ]);
  return Number.parseFloat(durationText.trim());
};
