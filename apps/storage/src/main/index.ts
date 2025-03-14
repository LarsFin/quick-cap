import dotenv from "dotenv";

import { start } from "./server/start";

// load env variables
dotenv.config();

// start server
start();
