import express from "express";

import { loadConfig } from "../utils/config";

export const start = () => {
  // load config object from environment
  const config = loadConfig(process.env);

  if (config.err) {
    console.error(config.err);
    process.exit(1);
  }

  const app = express();

  app.route("/").get((req, res) => {
    res.send("Hello World");
  });

  app.listen(config.data.PORT, () => {
    console.log(`Server is running on port ${config.data.PORT}`);
  });
};
