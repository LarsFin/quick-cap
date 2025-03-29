import { Express } from "express";

import {
  createApp,
  initialiseDependencies,
  AppDependencies,
} from "../../main/server";
import { Config } from "../../main/utils/config";

import { createTestDatabase } from "./setup/pg";
import { seedTestDatabase } from "./setup/seed";

const baseTestDbUrl = "postgresql://test:integration@localhost:5433/base";

const testConfig: Config = {
  DATABASE_URL: baseTestDbUrl,
  PORT: 3000,
  API_TOKEN: "test-token",
  __DEV__: true,
  LOG_LEVEL: "error",
};

export type TestApp = {
  app: Express;
  deps: AppDependencies;
  dbUrl: string;
};

/**
 * Creates and returns a test app as well as a function for tearing down unnecessary resources
 */
export const setup = async (): Promise<TestApp> => {
  const dbUrl = await createTestDatabase(baseTestDbUrl);

  await seedTestDatabase(dbUrl);

  const deps = initialiseDependencies({
    ...testConfig,
    DATABASE_URL: dbUrl,
  });

  return {
    app: createApp(deps),
    deps,
    dbUrl,
  };
};
