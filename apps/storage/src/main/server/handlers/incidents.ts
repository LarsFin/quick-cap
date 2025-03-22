import { Request, Response, Router, RequestHandler } from "express";
import { AppDependencies } from "..";

export const initialiseGetAllIncidentsHandler = ({
  incidents,
}: AppDependencies): RequestHandler => {
  return async (_: Request, res: Response) => {
    const query = await incidents.getAll();

    // TODO: handle other error types outside of just zod
    if (query.err !== null) {
      res.status(400).json({ error: query.err });
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
  router.post("/incidents", initialiseCreateIncidentHandler(dependencies));
};
