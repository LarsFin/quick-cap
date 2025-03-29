import { Request, Response, Router, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppDependencies } from "..";

export const initialiseGetAllIncidentsHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (_: Request, res: Response) => {
    const query = await incidents.getAll();

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseGetIncidentHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid incident ID" });
      return;
    }

    const query = await incidents.get(id);

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (query.data === null) {
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseCreateIncidentHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const query = await incidents.create(req.body);

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

export const initialisePatchIncidentHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid incident ID" });
      return;
    }

    const query = await incidents.patch(id, req.body);

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
      res.status(404).json({ error: "Incident not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseDeleteIncidentHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid incident ID" });
      return;
    }

    const err = await incidents.delete(id);

    if (err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // prioritising idempotency, don't care if the request didn't actually delete anything
    res.status(204).send();
  };
};

export const initialiseIncidentsHandlers = (
  router: Router,
  dependencies: AppDependencies
) => {
  router.get("/incidents", initialiseGetAllIncidentsHandler(dependencies));
  router.get("/incidents/:id", initialiseGetIncidentHandler(dependencies));
  router.post("/incidents", initialiseCreateIncidentHandler(dependencies));
  router.patch("/incidents/:id", initialisePatchIncidentHandler(dependencies));
  router.delete(
    "/incidents/:id",
    initialiseDeleteIncidentHandler(dependencies)
  );
};
