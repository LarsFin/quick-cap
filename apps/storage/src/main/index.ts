import dotenv from "dotenv";

import { createApp, initialiseDependencies, startApp } from "./server";
import { loadConfig } from "./utils/config";

// load env variables
dotenv.config();

// load config
const config = loadConfig(process.env);

if (config.err) {
  console.error(config.err);
  process.exit(1);
}

// initialise dependencies
const deps = initialiseDependencies(config.data);

// instrument app with routes
const app = createApp(deps);

// start server
startApp(app, deps);
