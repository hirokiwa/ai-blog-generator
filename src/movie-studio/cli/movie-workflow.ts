import * as dotenv from "dotenv";
import { join } from "path";
import { renderMovieBundle } from "../render/render-movie-bundle";
import { publishRenderedMovieBundle } from "../youtube/publish-to-youtube";
import { parseCliOptions } from "./options";

dotenv.config();

const main = async (): Promise<void> => {
  const { movieKinds, artifactDirectoryPath } = parseCliOptions();
  const renderedMovieBundle = await renderMovieBundle({
    selectedMovieKinds: movieKinds,
    artifactDirectoryPath,
  });

  if (process.env["MOVIE_STUDIO_SKIP_YOUTUBE_UPLOAD"] === "true") {
    console.log(`Skipping YouTube upload. renderedBundle=${join(renderedMovieBundle.artifactDirectoryPath, "rendered-bundle.json")}`);
    return;
  }

  await publishRenderedMovieBundle(renderedMovieBundle);
};

void main();
