export class MovieStudioError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "MovieStudioError";
  }
}
