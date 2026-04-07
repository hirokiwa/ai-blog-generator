import { readFile } from "fs/promises";
import * as dotenv from "dotenv";
import { publishRenderedMovieBundle } from "../youtube/publish-to-youtube";
import { MovieStudioError } from "../shared/errors";
import type { RenderedMovieBundle } from "../shared/types";
import { parseCliOptions } from "./options";

dotenv.config();

const readRenderedMovieBundle = async (
  renderedBundleFilePath?: string,
): Promise<RenderedMovieBundle> => {
  if (renderedBundleFilePath === undefined) {
    throw new MovieStudioError("--renderedBundle is required for publish.");
  }

  const renderedBundleFile = await readFile(renderedBundleFilePath, "utf8");
  return JSON.parse(renderedBundleFile) as RenderedMovieBundle;
};

const main = async (): Promise<void> => {
  const { renderedBundleFilePath } = parseCliOptions();
  const renderedMovieBundle = await readRenderedMovieBundle(renderedBundleFilePath);
  await publishRenderedMovieBundle(renderedMovieBundle);
};

void main();
