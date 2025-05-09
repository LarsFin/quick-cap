import { PrismaClient } from "@prisma/client";
import { Express } from "express";

import { createApp, initialiseDependencies } from "../../main/server";
import { Config } from "../../main/utils/config";

import { createTestDatabase } from "./setup/pg";

const baseTestDbUrl = "postgresql://test:integration@localhost:5433/base";

const testConfig: Config = {
  DATABASE_URL: baseTestDbUrl,
  PORT: 3000,
  API_TOKEN: "test-token",
  __DEV__: false,
  LOG_LEVEL: "error",
};

export type TestApp = {
  app: Express;
  config: Config;
  prisma: PrismaClient;
};

/**
 * Creates a test app with a connection to an isolated test database to avoid
 * race conditions between tests.
 */
export const setup = async (): Promise<TestApp> => {
  const etherealDbUrl = await createTestDatabase(baseTestDbUrl);

  const deps = initialiseDependencies({
    ...testConfig,
    DATABASE_URL: etherealDbUrl,
  });

  // we return a prisma client so tests can verify database state
  return {
    app: createApp(deps),
    config: testConfig,
    prisma: new PrismaClient({
      datasources: {
        db: {
          url: etherealDbUrl,
        },
      },
    }),
  };
};
