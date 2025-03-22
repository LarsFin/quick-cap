import express from "express";

import { Config, loadConfig } from "../utils/config";
import { initPrismaDb } from "../db/prisma";
import { initialiseIncidentsHandlers } from "./handlers/incidents";
import { Incidents } from "../services/incidents";

export type AppDependencies = {
  incidents: Incidents;
};

const initialiseDependencies = (config: Config): AppDependencies => {
  // currently tying instantiation to prisma
  const db = initPrismaDb();

  const incidents = new Incidents(db);

  return { incidents };
};

const initialiseRouter = (dependencies: AppDependencies) => {
  const router = express.Router();

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
