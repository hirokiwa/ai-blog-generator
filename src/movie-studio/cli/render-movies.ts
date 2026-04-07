import * as dotenv from "dotenv";
import { renderMovieBundle } from "../render/render-movie-bundle";
import { parseCliOptions } from "./options";

dotenv.config();

const main = async (): Promise<void> => {
  const { movieKinds, artifactDirectoryPath, mockBlogFilePath } = parseCliOptions();
  const renderedMovieBundle = await renderMovieBundle({
    selectedMovieKinds: movieKinds,
    artifactDirectoryPath,
    mockBlogFilePath,
  });
  console.log(JSON.stringify(renderedMovieBundle, null, 2));
};

void main();
