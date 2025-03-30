import { Request, Response, Router, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppDependencies } from "..";

export const initialiseGetAllAlertsHandler = ({
  alerts,
}: AppDependencies): RequestHandler => {
  return async (_: Request, res: Response) => {
    const query = await alerts.getAll();

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseGetAlertHandler = ({
  alerts,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid alert ID" });
      return;
    }

    const query = await alerts.get(id);

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (query.data === null) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseCreateAlertHandler = ({
  alerts,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const query = await alerts.create(req.body);

    if (query.err !== null) {
      // a zod error stems from the client sending bad data
      if (query.err instanceof ZodError) {
        res.status(400).json({ error: query.err });
        return;
      }

      // a db error stems from the server
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    res.status(201).json(query.data);
  };
};

export const initialisePatchAlertHandler = ({
  alerts,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid alert ID" });
      return;
    }

    const query = await alerts.patch(id, req.body);

    if (query.err !== null) {
      // a zod error stems from the client sending bad data
      if (query.err instanceof ZodError) {
        res.status(400).json({ error: query.err });
        return;
      }

      // a db error stems from the server
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (query.data === null) {
      res.status(404).json({ error: "Alert not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseDeleteAlertHandler = ({
  alerts,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid alert ID" });
      return;
    }

    const err = await alerts.delete(id);

    if (err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // prioritising idempotency, don't care if the request didn't actually delete anything
    res.status(204).send();
  };
};

export const initialiseAlertsHandlers = (
  router: Router,
  dependencies: AppDependencies
) => {
  router.get("/alerts", initialiseGetAllAlertsHandler(dependencies));
  router.get("/alerts/:id", initialiseGetAlertHandler(dependencies));
  router.post("/alerts", initialiseCreateAlertHandler(dependencies));
  router.patch("/alerts/:id", initialisePatchAlertHandler(dependencies));
  router.delete("/alerts/:id", initialiseDeleteAlertHandler(dependencies));
};
