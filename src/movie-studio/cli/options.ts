import { parseArgs } from "util";
import { supportedMovieKinds } from "../shared/constants";
import { MovieStudioError } from "../shared/errors";
import type { MovieKind } from "../shared/types";

const parseMovieKinds = (movieKindsOption?: string): MovieKind[] => {
  if (movieKindsOption === undefined || movieKindsOption.trim().length === 0) {
    return [...supportedMovieKinds];
  }

  const requestedMovieKinds = movieKindsOption
    .split(",")
    .map((movieKind) => movieKind.trim())
    .filter((movieKind) => movieKind.length > 0);

  const invalidMovieKinds = requestedMovieKinds.filter((movieKind) => {
    return !supportedMovieKinds.includes(movieKind as MovieKind);
  });

  if (requestedMovieKinds.length === 0 || invalidMovieKinds.length > 0) {
    throw new MovieStudioError(
      `Invalid --kinds value. expected=${supportedMovieKinds.join(",")} received=${movieKindsOption}`,
    );
  }

  return requestedMovieKinds as MovieKind[];
};

export const parseCliOptions = (): {
  movieKinds: MovieKind[];
  artifactDirectoryPath?: string;
  renderedBundleFilePath?: string;
  mockBlogFilePath?: string;
} => {
  const parsedArguments = parseArgs({
    allowPositionals: true,
    options: {
      kinds: {
        type: "string",
      },
      artifactDirectory: {
        type: "string",
      },
      renderedBundle: {
        type: "string",
      },
      mockBlog: {
        type: "string",
      },
    },
  });

  const positionalMovieKinds = parsedArguments.positionals;
  const movieKindsOption = parsedArguments.values.kinds;

  if (movieKindsOption !== undefined && positionalMovieKinds.length > 0) {
    throw new MovieStudioError("Use either --kinds or positional movie kinds, not both.");
  }

  const resolvedMovieKindsOption = movieKindsOption ?? (
    positionalMovieKinds.length > 0 ? positionalMovieKinds.join(",") : undefined
  );

  return {
    movieKinds: parseMovieKinds(resolvedMovieKindsOption),
    artifactDirectoryPath: parsedArguments.values.artifactDirectory,
    renderedBundleFilePath: parsedArguments.values.renderedBundle,
    mockBlogFilePath: parsedArguments.values.mockBlog,
  };
};
