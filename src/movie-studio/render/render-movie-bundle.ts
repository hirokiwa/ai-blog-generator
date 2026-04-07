import { rm } from "fs/promises";
import { join } from "path";
import { synthesizeScriptAudio } from "../audio/synthesize-script-audio";
import { fetchLatestBlogPublishedToday } from "../blog/blog-source";
import {
  defaultBlogTimeZone,
  defaultVoicevoxSpeaker,
  movieArtifactRootDirectoryName,
} from "../shared/constants";
import { getDayKeyInTimeZone, getIsoStringWithoutMilliseconds } from "../shared/date";
import { downloadMovieStudioAssets } from "../shared/download-assets";
import { MovieStudioError } from "../shared/errors";
import { ensureDirectory, joinArtifactPath, writeJsonFile } from "../shared/file-system";
import type { RenderedMovieArtifact, RenderedMovieBundle, MovieKind } from "../shared/types";
import { buildVideoScripts } from "../script/build-video-scripts";
import { buildNarrationSentences, getShortNarrationSentences } from "../script/text";
import { renderLongThumbnail, renderShortThumbnail } from "../thumbnail/render-thumbnail";
import {
  concatenateAudioClips,
  createConcatListFile,
  createSilentAudioClip,
  muxVideoAndAudio,
  renderMovieVideo,
  type TimedCaptionSegment,
} from "./render-segment-clip";

interface TimedMovieSegment extends TimedCaptionSegment {
  audioFilePath: string;
  durationSeconds: number;
}

const sentenceGapDurationSeconds = 0.5;

interface BuiltTimedMovieSegments {
  timedMovieSegments: TimedMovieSegment[];
  audioClipFilePaths: string[];
}

const getSharedGapAudioFilePath = (audioClipDirectoryPath: string): string => {
  return join(audioClipDirectoryPath, `shared-gap-${String(sentenceGapDurationSeconds).replace(".", "_")}s.wav`);
};

const buildTimedMovieSegments = async ({
  script,
  audioManifest,
  audioClipDirectoryPath,
}: {
  script: ReturnType<typeof buildVideoScripts>["scripts"][MovieKind];
  audioManifest: Awaited<ReturnType<typeof synthesizeScriptAudio>>;
  audioClipDirectoryPath: string;
}): Promise<BuiltTimedMovieSegments> => {
  console.log(`[movie-studio] build timeline kind=${script.kind} segments=${String(script.segments.length)}`);
  const timedMovieSegments: TimedMovieSegment[] = [];
  const audioClipFilePaths: string[] = [];
  const sharedGapAudioFilePath = getSharedGapAudioFilePath(audioClipDirectoryPath);
  let currentStartSeconds = 0;

  for (const [segmentIndex, segment] of script.segments.entries()) {
    const audioInfo = segment.audioKey === undefined ? undefined : audioManifest.get(segment.audioKey);
    const durationSeconds = segment.durationSeconds ?? audioInfo?.durationSeconds ?? 1;
    const audioFilePath = audioInfo?.audioFilePath ?? join(
      audioClipDirectoryPath,
      `${String(segmentIndex + 1).padStart(3, "0")}-${segment.id}.wav`,
    );

    if (audioInfo === undefined) {
      console.log(
        `[movie-studio] create silent audio kind=${script.kind} segment=${String(segmentIndex + 1)}/${String(script.segments.length)} duration=${durationSeconds.toFixed(3)}s`,
      );
      await createSilentAudioClip(audioFilePath, durationSeconds);
    }

    audioClipFilePaths.push(audioFilePath);

    const hasFollowingSegment = segmentIndex < script.segments.length - 1;
    const captionEndSeconds = currentStartSeconds + durationSeconds + (
      hasFollowingSegment ? sentenceGapDurationSeconds : 0
    );

    timedMovieSegments.push({
      id: segment.id,
      captionText: segment.captionText,
      startSeconds: currentStartSeconds,
      endSeconds: captionEndSeconds,
      audioFilePath,
      durationSeconds,
    });
    currentStartSeconds += durationSeconds;

    if (hasFollowingSegment) {
      if (segmentIndex === 0) {
        console.log(
          `[movie-studio] create shared sentence gap kind=${script.kind} duration=${sentenceGapDurationSeconds.toFixed(3)}s`,
        );
        await createSilentAudioClip(sharedGapAudioFilePath, sentenceGapDurationSeconds);
      }

      audioClipFilePaths.push(sharedGapAudioFilePath);
      currentStartSeconds += sentenceGapDurationSeconds;
    }
  }

  return {
    timedMovieSegments,
    audioClipFilePaths,
  };
};

const cleanupIntermediateArtifacts = async (artifactDirectoryPath: string): Promise<void> => {
  await Promise.all([
    rm(joinArtifactPath(artifactDirectoryPath, "audio"), { recursive: true, force: true }),
    rm(joinArtifactPath(artifactDirectoryPath, "segment-audio"), { recursive: true, force: true }),
    rm(joinArtifactPath(artifactDirectoryPath, "captions"), { recursive: true, force: true }),
    rm(joinArtifactPath(artifactDirectoryPath, "assets"), { recursive: true, force: true }),
  ]);
};

const buildRenderedMovieArtifacts = async ({
  selectedMovieKinds,
  scripts,
  audioManifest,
  artifactDirectoryPath,
  assets,
  blogTitle,
  dayKey,
  headerText,
}: {
  selectedMovieKinds: MovieKind[];
  scripts: ReturnType<typeof buildVideoScripts>["scripts"];
  audioManifest: Awaited<ReturnType<typeof synthesizeScriptAudio>>;
  artifactDirectoryPath: string;
  assets: Awaited<ReturnType<typeof downloadMovieStudioAssets>>;
  blogTitle: string;
  dayKey: string;
  headerText: string;
}): Promise<RenderedMovieArtifact[]> => {
  const renderedMovies: RenderedMovieArtifact[] = [];

  for (const movieKind of selectedMovieKinds) {
    const script = scripts[movieKind];
    const audioClipDirectoryPath = joinArtifactPath(artifactDirectoryPath, "segment-audio", movieKind);
    const captionDirectoryPath = joinArtifactPath(artifactDirectoryPath, "captions", movieKind);
    await ensureDirectory(audioClipDirectoryPath);
    await ensureDirectory(captionDirectoryPath);

    console.log(`[movie-studio] render start kind=${movieKind}`);
    const { timedMovieSegments, audioClipFilePaths } = await buildTimedMovieSegments({
      script,
      audioManifest,
      audioClipDirectoryPath,
    });
    const lastTimedMovieSegment = timedMovieSegments.at(-1);

    if (lastTimedMovieSegment === undefined) {
      throw new MovieStudioError(`Timed movie segments were empty. kind=${movieKind}`);
    }

    const totalDurationSeconds = lastTimedMovieSegment.endSeconds;

    const audioConcatListFilePath = joinArtifactPath(artifactDirectoryPath, "segment-audio", `${movieKind}.txt`);
    const concatenatedAudioFilePath = joinArtifactPath(artifactDirectoryPath, "final", `${movieKind}.audio.wav`);
    const renderedVideoFilePath = joinArtifactPath(artifactDirectoryPath, "final", `${movieKind}.video.mp4`);
    const outputVideoFilePath = joinArtifactPath(artifactDirectoryPath, "final", `${movieKind}.mp4`);

    console.log(`[movie-studio] concatenate audio kind=${movieKind} segments=${String(timedMovieSegments.length)}`);
    await createConcatListFile(
      audioConcatListFilePath,
      audioClipFilePaths,
    );
    await concatenateAudioClips(audioConcatListFilePath, concatenatedAudioFilePath);

    console.log(`[movie-studio] render full video kind=${movieKind} duration=${totalDurationSeconds.toFixed(3)}s`);
    await renderMovieVideo({
      script,
      timedSegments: timedMovieSegments,
      imageFilePath: assets.ojisanImageFilePath,
      outputFilePath: renderedVideoFilePath,
      temporaryDirectoryPath: captionDirectoryPath,
      totalDurationSeconds,
    });

    console.log(`[movie-studio] mux final movie kind=${movieKind}`);
    await muxVideoAndAudio(
      renderedVideoFilePath,
      concatenatedAudioFilePath,
      outputVideoFilePath,
      totalDurationSeconds,
    );
    await rm(renderedVideoFilePath, { force: true });
    await rm(concatenatedAudioFilePath, { force: true });

    const thumbnailFilePath = joinArtifactPath(artifactDirectoryPath, "thumbnails", `${movieKind}.png`);
    console.log(`[movie-studio] render thumbnail kind=${movieKind}`);
    if (movieKind === "short") {
      await renderShortThumbnail({
        sourceImageFilePath: assets.shortThumbnailSourceImageFilePath,
        outputFilePath: thumbnailFilePath,
        title: blogTitle,
        dayKey,
      });
    } else {
      await renderLongThumbnail({
        ojisanImageFilePath: assets.ojisanImageFilePath,
        outputFilePath: thumbnailFilePath,
        title: blogTitle,
        headerText,
      });
    }

    renderedMovies.push({
      kind: movieKind,
      videoFilePath: outputVideoFilePath,
      thumbnailFilePath,
    });
    console.log(`[movie-studio] render done kind=${movieKind} output=${outputVideoFilePath}`);
  }

  return renderedMovies;
};

export const renderMovieBundle = async ({
  selectedMovieKinds,
  artifactDirectoryPath,
  timeZone = defaultBlogTimeZone,
}: {
  selectedMovieKinds: MovieKind[];
  artifactDirectoryPath?: string;
  timeZone?: string;
}): Promise<RenderedMovieBundle> => {
  const currentDate = new Date();
  console.log(`[movie-studio] fetch latest blog currentDate=${currentDate.toISOString()} timeZone=${timeZone}`);
  const blog = await fetchLatestBlogPublishedToday(currentDate, timeZone);
  console.log(`[movie-studio] fetched blog id=${blog.id} publishedAt=${blog.publishedAt}`);

  const narrationSentences = buildNarrationSentences(blog);
  const shortNarrationSentences = getShortNarrationSentences(narrationSentences);
  const { headerText, scripts } = buildVideoScripts(
    blog.publishedAt,
    timeZone,
    blog.title,
    narrationSentences,
    shortNarrationSentences,
  );

  const dayKey = getDayKeyInTimeZone(new Date(blog.publishedAt), timeZone);
  const resolvedArtifactDirectoryPath = artifactDirectoryPath ?? join(
    process.cwd(),
    movieArtifactRootDirectoryName,
    `${dayKey}-${blog.id}`,
  );

  await ensureDirectory(resolvedArtifactDirectoryPath);
  await ensureDirectory(joinArtifactPath(resolvedArtifactDirectoryPath, "final"));
  await ensureDirectory(joinArtifactPath(resolvedArtifactDirectoryPath, "thumbnails"));
  await ensureDirectory(joinArtifactPath(resolvedArtifactDirectoryPath, "segment-audio"));
  await ensureDirectory(joinArtifactPath(resolvedArtifactDirectoryPath, "captions"));

  console.log(`[movie-studio] download assets directory=${joinArtifactPath(resolvedArtifactDirectoryPath, "assets")}`);
  const assets = await downloadMovieStudioAssets(joinArtifactPath(resolvedArtifactDirectoryPath, "assets"));

  const speakerId = Number(process.env["VOICEVOX_SPEAKER_ID"] ?? String(defaultVoicevoxSpeaker));
  console.log(`[movie-studio] synthesize audio speaker=${String(speakerId)} concurrency=${process.env["VOICEVOX_CONCURRENCY"] ?? "2"}`);
  const audioManifest = await synthesizeScriptAudio(
    selectedMovieKinds.map((movieKind) => scripts[movieKind]),
    joinArtifactPath(resolvedArtifactDirectoryPath, "audio"),
    process.env["VOICEVOX_ENGINE_URL"] ?? "http://voicevox:50021",
    speakerId,
    Number(process.env["VOICEVOX_CONCURRENCY"] ?? "2"),
  );
  console.log(`[movie-studio] synthesized audio entries=${String(audioManifest.size)}`);

  const renderedMovies = await buildRenderedMovieArtifacts({
    selectedMovieKinds,
    scripts,
    audioManifest,
    artifactDirectoryPath: resolvedArtifactDirectoryPath,
    assets,
    blogTitle: blog.title,
    dayKey,
    headerText,
  });

  console.log("[movie-studio] cleanup intermediate artifacts");
  await cleanupIntermediateArtifacts(resolvedArtifactDirectoryPath);

  const renderedMovieBundle: RenderedMovieBundle = {
    blog,
    publishAtIsoString: getIsoStringWithoutMilliseconds(new Date(blog.publishedAt)),
    headerText,
    artifactDirectoryPath: resolvedArtifactDirectoryPath,
    renderedMovies,
  };

  await writeJsonFile(
    joinArtifactPath(resolvedArtifactDirectoryPath, "rendered-bundle.json"),
    renderedMovieBundle,
  );

  console.log(`[movie-studio] render bundle written path=${joinArtifactPath(resolvedArtifactDirectoryPath, "rendered-bundle.json")}`);
  return renderedMovieBundle;
};
