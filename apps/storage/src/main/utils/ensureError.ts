export const ensureError = (error: unknown): Error => {
  if (error instanceof Error) return error;

  if (typeof error === "string") return new Error(error);

  // TODO: handle this better, this is far too generic when debugging
  return new Error(`Unexpected error type: ${typeof error}`);
};
