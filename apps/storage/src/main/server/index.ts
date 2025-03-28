import express, { Express } from "express";

import { initPrismaDb } from "../db/prisma";
import { Incidents } from "../services/incidents";
import { Config, loadConfig } from "../utils/config";
import { Logger, resolveLogger } from "../utils/logger";

import { initialiseIncidentsHandlers } from "./handlers/incidents";
import { challengeBearerToken } from "./middleware/auth";

export type AppDependencies = {
  config: Config;
  incidents: Incidents;
  logger: Logger;
};

export const initialiseDependencies = (): AppDependencies => {
  const rawConfig = loadConfig(process.env);

  if (rawConfig.err) {
    console.error(rawConfig.err);
    process.exit(1);
  }

  const config = rawConfig.data;
  const logger = resolveLogger(config);

  // currently tying instantiation to prisma
  const db = initPrismaDb(config.DATABASE_URL);

  const incidents = new Incidents(db, logger);

  return { config, incidents, logger };
};

export const createApp = (deps: AppDependencies): Express => {
  const app = express();
  app.use(express.json());

  const router = express.Router();

  if (!deps.config.__DEV__) {
    router.use(challengeBearerToken(deps.config.API_TOKEN));
  } else {
    deps.logger.warning("Running in dev mode, skipping auth middleware");
  }

  initialiseIncidentsHandlers(router, deps);

  app.use("/api/v1", router);

  return app;
};

export const startApp = (app: Express, deps: AppDependencies) => {
  app.listen(deps.config.PORT, () => {
    deps.logger.info(`Server is running on port ${deps.config.PORT}`);
  });
};
