import { Request, Response, Router, RequestHandler } from "express";

import { AppDependencies } from "..";

export const initialiseGetAllIncidentsHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (_: Request, res: Response) => {
    const query = await incidents.getAll();

    // TODO: handle other error types outside of just zod
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

    // TODO: handle other error types outside of just zod
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

    // TODO: handle other error types outside of just zod
    if (query.err !== null) {
      res.status(400).json({ error: query.err });
      return;
    }

    res.json(query.data);
  };
};

export const initialiseIncidentsHandlers = (
  router: Router,
  dependencies: AppDependencies
) => {
  router.get("/incidents", initialiseGetAllIncidentsHandler(dependencies));
  router.get("/incidents/:id", initialiseGetIncidentHandler(dependencies));
  router.post("/incidents", initialiseCreateIncidentHandler(dependencies));
};
