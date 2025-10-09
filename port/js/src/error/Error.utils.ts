export class ErrorUtils {
  static withCause(message: string, err: unknown): Error {
    return new Error(message, { cause: err instanceof Error ? err : new Error(String(err)) });
  }
}
