export type Query<E extends Error> = E | null;
export type Result<T, E extends Error> =
  | { data: T; err: null }
  | { data: null; err: E };
export type PromisedResult<T, E extends Error> = Promise<Result<T, E>>;

export const ok = () => null;
export const res = <T>(data: T) => ({ data, err: null });
export const err = <E extends Error>(err: E) => ({ data: null, err });
