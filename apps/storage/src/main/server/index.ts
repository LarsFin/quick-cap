import express, { Express } from "express";

import { initPrismaDb } from "../db/prisma";
import { Incidents } from "../services/incidents";
import { Services } from "../services/services";
import { Config } from "../utils/config";
import { Logger, resolveLogger } from "../utils/logger";

import { initialiseIncidentsHandlers } from "./handlers/incidents";
import { initialiseServicesHandlers } from "./handlers/services";
import { challengeBearerToken } from "./middleware/auth";

export type AppDependencies = {
  config: Config;
  incidents: Incidents;
  services: Services;
  logger: Logger;
};

export const initialiseDependencies = (config: Config): AppDependencies => {
  const logger = resolveLogger(config);

  // currently tying instantiation to prisma
  const db = initPrismaDb(config.DATABASE_URL);

  const incidents = new Incidents(db, logger);
  const services = new Services(db, logger);

  return { config, incidents, services, logger };
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
  initialiseServicesHandlers(router, deps);
  app.use("/api/v1", router);

  return app;
};

export const startApp = (app: Express, deps: AppDependencies) => {
  app.listen(deps.config.PORT, () => {
    deps.logger.info(`Server is running on port ${deps.config.PORT}`);
  });
};
