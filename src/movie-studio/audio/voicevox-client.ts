import { writeFile } from "fs/promises";
import { MovieStudioError } from "../shared/errors";

interface VoicevoxAudioQuery {
  speedScale: number;
  pitchScale: number;
  intonationScale: number;
  volumeScale: number;
  prePhonemeLength: number;
  postPhonemeLength: number;
  outputSamplingRate: number;
  outputStereo: boolean;
  kana?: string;
}

const assertResponseOk = async (response: Response): Promise<void> => {
  if (!response.ok) {
    throw new MovieStudioError(
      `VOICEVOX request failed. status=${response.status} body=${await response.text()}`,
    );
  }
};

export const waitForVoicevox = async (
  engineUrl: string,
  maxAttemptCount = 30,
): Promise<void> => {
  for (let attemptCount = 1; attemptCount <= maxAttemptCount; attemptCount += 1) {
    try {
      const response = await fetch(`${engineUrl}/version`);
      await assertResponseOk(response);
      return;
    } catch (error) {
      if (attemptCount === maxAttemptCount) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
};

const createAudioQuery = async (
  engineUrl: string,
  speakerId: number,
  text: string,
): Promise<VoicevoxAudioQuery> => {
  const parameters = new URLSearchParams({
    speaker: String(speakerId),
    text,
  });
  const response = await fetch(`${engineUrl}/audio_query?${parameters.toString()}`, {
    method: "POST",
  });
  await assertResponseOk(response);
  return (await response.json()) as VoicevoxAudioQuery;
};

const synthesizeAudio = async (
  engineUrl: string,
  speakerId: number,
  audioQuery: VoicevoxAudioQuery,
): Promise<ArrayBuffer> => {
  const response = await fetch(`${engineUrl}/synthesis?speaker=${String(speakerId)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(audioQuery),
  });
  await assertResponseOk(response);
  return await response.arrayBuffer();
};

export const synthesizeSpeechToFile = async (
  engineUrl: string,
  speakerId: number,
  text: string,
  outputFilePath: string,
): Promise<void> => {
  const audioQuery = await createAudioQuery(engineUrl, speakerId, text);
  audioQuery.speedScale = 1;
  audioQuery.prePhonemeLength = 0;
  audioQuery.postPhonemeLength = 0;
  audioQuery.outputStereo = false;
  const synthesizedAudio = await synthesizeAudio(engineUrl, speakerId, audioQuery);
  await writeFile(outputFilePath, Buffer.from(synthesizedAudio));
};
