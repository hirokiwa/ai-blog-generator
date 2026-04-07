import { defaultVoicevoxConcurrency, defaultVoicevoxSpeaker } from "../shared/constants";
import type { VideoScript } from "../shared/types";
import { ensureAudioDirectory, audioFileExists, createAudioCacheFilePath } from "./audio-cache";
import { getAudioDurationSeconds } from "./audio-duration";
import { synthesizeSpeechToFile, waitForVoicevox } from "./voicevox-client";

const runPromisePool = async (
  taskFactories: Array<() => Promise<void>>,
  concurrency: number,
): Promise<void> => {
  const runningTasks = new Set<Promise<void>>();

  for (const taskFactory of taskFactories) {
    const taskPromise = taskFactory().finally(() => {
      runningTasks.delete(taskPromise);
    });
    runningTasks.add(taskPromise);

    if (runningTasks.size >= concurrency) {
      await Promise.race(runningTasks);
    }
  }

  await Promise.all(runningTasks);
};

export const synthesizeScriptAudio = async (
  scripts: VideoScript[],
  audioDirectoryPath: string,
  engineUrl: string,
  speakerId = defaultVoicevoxSpeaker,
  concurrency = defaultVoicevoxConcurrency,
): Promise<Map<string, { audioFilePath: string; durationSeconds: number }>> => {
  await waitForVoicevox(engineUrl);
  await ensureAudioDirectory(audioDirectoryPath);

  const uniqueAudioKeys = [...new Set(
    scripts.flatMap((script) => {
      return script.segments.map((segment) => segment.audioKey).filter((audioKey): audioKey is string => audioKey !== undefined);
    }),
  )];

  const audioManifest = new Map<string, { audioFilePath: string; durationSeconds: number }>();
  let completedTaskCount = 0;

  console.log(
    `[movie-studio] audio synthesis start items=${String(uniqueAudioKeys.length)} concurrency=${String(concurrency)} speaker=${String(speakerId)}`,
  );

  await runPromisePool(
    uniqueAudioKeys.map((audioKey, audioIndex) => {
      return async () => {
        const audioFilePath = createAudioCacheFilePath(audioDirectoryPath, audioKey);
        const isCached = await audioFileExists(audioFilePath);

        console.log(
          `[movie-studio] audio ${String(audioIndex + 1)}/${String(uniqueAudioKeys.length)} ${isCached ? "cache-hit" : "synthesize"} key=${audioKey.slice(0, 24)}`,
        );

        if (!isCached) {
          await synthesizeSpeechToFile(engineUrl, speakerId, audioKey, audioFilePath);
        }
        const durationSeconds = await getAudioDurationSeconds(audioFilePath);
        audioManifest.set(audioKey, { audioFilePath, durationSeconds });
        completedTaskCount += 1;
        console.log(
          `[movie-studio] audio done ${String(completedTaskCount)}/${String(uniqueAudioKeys.length)} duration=${durationSeconds.toFixed(3)}s`,
        );
      };
    }),
    concurrency,
  );

  return audioManifest;
};
