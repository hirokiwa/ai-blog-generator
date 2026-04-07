export type MovieKind = "long" | "short";

export interface NarrationSentence {
  id: string;
  speechText: string;
  captionText: string;
}

export interface VideoScriptSegment {
  id: string;
  speechText?: string;
  captionText: string;
  audioKey?: string;
  durationSeconds?: number;
}

export interface VideoScript {
  kind: MovieKind;
  dimensions: {
    width: number;
    height: number;
  };
  captionLayout: {
    fontSize: number;
    maxCharactersPerLine: number;
    bottomMargin: number;
    lineSpacing: number;
    boxWidth: number;
  };
  headerText: string;
  headerFontSize: number;
  imageScaleWidth: number;
  segments: VideoScriptSegment[];
}

export interface MovieStudioAssets {
  ojisanImageFilePath: string;
  shortThumbnailSourceImageFilePath: string;
}

export interface BlogVideoSource {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
}

export interface RenderedMovieArtifact {
  kind: MovieKind;
  videoFilePath: string;
  thumbnailFilePath: string;
}

export interface RenderedMovieBundle {
  blog: BlogVideoSource;
  publishAtIsoString: string;
  headerText: string;
  artifactDirectoryPath: string;
  renderedMovies: RenderedMovieArtifact[];
}
