import { z, ZodError } from "zod";

import { err, res, Result } from "./result";

export const configSchema = z.object({
  __DEV__: z.coerce.boolean().default(false),

  API_TOKEN: z.string(),

  PORT: z.coerce.number().default(7080),

  DATABASE_URL: z.string(),
});
export type Config = z.infer<typeof configSchema>;

export const loadConfig = (
  env: Record<string, string | undefined>
): Result<Config, ZodError> => {
  const configParse = configSchema.safeParse(env);
  return configParse.success ? res(configParse.data) : err(configParse.error);
};
