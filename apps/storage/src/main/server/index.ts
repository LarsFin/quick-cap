import express from "express";

import { Config, loadConfig } from "../utils/config";
import { Db } from "../db";
import { initPrismaDb } from "../db/prisma";
import { getIncidentsHandler } from "./handlers/incidents";
import { createIncidentHandler } from "./handlers/incidents";

export type AppDependencies = {
  db: Db;
};

const initialiseDependencies = (config: Config): AppDependencies => {
  // currently tying instantiation to prisma
  const db = initPrismaDb();

  return { db };
};

const initialiseRouter = (dependencies: AppDependencies) => {
  const router = express.Router();

  router.get("/incidents", getIncidentsHandler(dependencies));
  router.post("/incidents", createIncidentHandler(dependencies));

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
