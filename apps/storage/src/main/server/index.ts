import express from "express";

import { initPrismaDb } from "../db/prisma";
import { Incidents } from "../services/incidents";
import { Config, loadConfig } from "../utils/config";

import { initialiseIncidentsHandlers } from "./handlers/incidents";
import { challengeBearerToken } from "./middleware/auth";

export type AppDependencies = {
  config: Config;
  incidents: Incidents;
};

const initialiseDependencies = (config: Config): AppDependencies => {
  // currently tying instantiation to prisma
  const db = initPrismaDb();

  const incidents = new Incidents(db);

  return { config, incidents };
};

const initialiseRouter = (dependencies: AppDependencies) => {
  const router = express.Router();

  if (!dependencies.config.__DEV__) {
    router.use(challengeBearerToken(dependencies.config.API_TOKEN));
  } else {
    console.warn("Running in dev mode, skipping auth middleware");
  }

  initialiseIncidentsHandlers(router, dependencies);

  return router;
};

export const start = () => {
  // load config object from environment
  const config = loadConfig(process.env);

  if (config.err) {
    console.error(config.err);
    process.exit(1);
  }

  const app = express();
  app.use(express.json());

  const dependencies = initialiseDependencies(config.data);

  const router = initialiseRouter(dependencies);

  app.use("/api/v1", router);

  app.listen(config.data.PORT, () => {
    console.log(`Server is running on port ${config.data.PORT}`);
  });
};
