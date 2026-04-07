import { createReadStream } from "fs";
import { google } from "googleapis";
import { MovieStudioError } from "../shared/errors";
import type { RenderedMovieBundle } from "../shared/types";

const longMovieTitleSuffix = "【長尺】";
const shortMovieTitleSuffix = "【ショート】";

const createYouTubeDescription = (blog: RenderedMovieBundle["blog"]): string => {
  return `#関西弁でお届けするAIおじさん毎日ブログ

「${blog.title}」

👇 続きを読む
https://ai-blog.hirokiwa.com/post/${blog.id}

AIおじさんは、大規模関西弁モデルのおじいちゃんです。
人間とは思えない勤勉さで毎日19時にブログを更新中。`;
};

const createOAuthClient = (): InstanceType<typeof google.auth.OAuth2> => {
  const clientId = process.env["YOUTUBE_CLIENT_ID"];
  const clientSecret = process.env["YOUTUBE_CLIENT_SECRET"];
  const redirectUri = process.env["YOUTUBE_REDIRECT_URI"];
  const refreshToken = process.env["YOUTUBE_REFRESH_TOKEN"];

  if (
    clientId === undefined ||
    clientSecret === undefined ||
    redirectUri === undefined ||
    refreshToken === undefined
  ) {
    throw new MovieStudioError("YouTube OAuth environment variables are missing.");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return oauth2Client;
};

const createVideoTitle = (blogTitle: string, kind: "long" | "short"): string => {
  const titleSuffix = kind === "long" ? longMovieTitleSuffix : shortMovieTitleSuffix;
  return `${blogTitle} ${titleSuffix}`;
};

export const publishRenderedMovieBundle = async (
  renderedMovieBundle: RenderedMovieBundle,
): Promise<void> => {
  const oauth2Client = createOAuthClient();
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  for (const renderedMovie of renderedMovieBundle.renderedMovies) {
    const insertedVideoResponse = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: createVideoTitle(renderedMovieBundle.blog.title, renderedMovie.kind),
          description: createYouTubeDescription(renderedMovieBundle.blog),
        },
        status: {
          privacyStatus: "private",
          publishAt: renderedMovieBundle.publishAtIsoString,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(renderedMovie.videoFilePath),
      },
    });

    const videoId = insertedVideoResponse.data.id ?? undefined;

    if (videoId === undefined) {
      throw new MovieStudioError(`YouTube video insertion did not return a video id. kind=${renderedMovie.kind}`);
    }

    await youtube.thumbnails.set({
      videoId,
      media: {
        body: createReadStream(renderedMovie.thumbnailFilePath),
      },
    });
  }
};
