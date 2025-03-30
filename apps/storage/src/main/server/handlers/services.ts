import { Request, Response, Router, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppDependencies } from "..";

export const initialiseGetAllServicesHandler = ({
  services,
}: AppDependencies): RequestHandler => {
  return async (_: Request, res: Response) => {
    const query = await services.getAll();

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseGetServiceHandler = ({
  services,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid service ID" });
      return;
    }

    const query = await services.get(id);

    // either a zod error or a db error, either are 500 errors on the server
    if (query.err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    if (query.data === null) {
      res.status(404).json({ error: "Service not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseCreateServiceHandler = ({
  services,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const query = await services.create(req.body);

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

export const initialisePatchServiceHandler = ({
  services,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid service ID" });
      return;
    }

    const query = await services.patch(id, req.body);

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
      res.status(404).json({ error: "Service not found" });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseDeleteServiceHandler = ({
  services,
}: AppDependencies): RequestHandler => {
  return async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid service ID" });
      return;
    }

    const err = await services.delete(id);

    if (err !== null) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    // prioritising idempotency, don't care if the request didn't actually delete anything
    res.status(204).send();
  };
};

export const initialiseServicesHandlers = (
  router: Router,
  dependencies: AppDependencies
) => {
  router.get("/services", initialiseGetAllServicesHandler(dependencies));
  router.get("/services/:id", initialiseGetServiceHandler(dependencies));
  router.post("/services", initialiseCreateServiceHandler(dependencies));
  router.patch("/services/:id", initialisePatchServiceHandler(dependencies));
  router.delete("/services/:id", initialiseDeleteServiceHandler(dependencies));
};
