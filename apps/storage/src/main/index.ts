import dotenv from "dotenv";

import { createApp, initialiseDependencies, startApp } from "./server";

// load env variables
dotenv.config();

// initialise dependencies
const deps = initialiseDependencies();

// instrument app with routes
const app = createApp(deps);

// start server
startApp(app, deps);
