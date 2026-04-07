import * as dotenv from "dotenv";
import { renderMovieBundle } from "../render/render-movie-bundle";
import { parseCliOptions } from "./options";

dotenv.config();

const main = async (): Promise<void> => {
  const { movieKinds, artifactDirectoryPath } = parseCliOptions();
  const renderedMovieBundle = await renderMovieBundle({
    selectedMovieKinds: movieKinds,
    artifactDirectoryPath,
  });
  console.log(JSON.stringify(renderedMovieBundle, null, 2));
};

void main();
