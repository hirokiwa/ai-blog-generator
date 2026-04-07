import { execFile } from "child_process";

export const execFileAsync = async (
  command: string,
  argumentsList: string[],
): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    execFile(command, argumentsList, (error) => {
      if (error !== null) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

export const escapeDrawtextText = (value: string): string => {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(":", "\\:")
    .replaceAll("'", "\\'")
    .replaceAll(",", "\\,")
    .replaceAll("[", "\\[")
    .replaceAll("]", "\\]")
    .replaceAll("%", "\\%");
};
