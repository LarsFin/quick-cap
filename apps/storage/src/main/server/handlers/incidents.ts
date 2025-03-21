import { Request, Response } from "express";
import { AppDependencies } from "..";

export const getIncidentsHandler = ({ db }: AppDependencies) => {
  return async (_: Request, res: Response) => {
    const incidents = await db.getIncidents();
    res.json(incidents);
  };
};

export const createIncidentHandler = ({ db }: AppDependencies) => {
  return async (req: Request, res: Response) => {
    const body = await req.body;
    console.log("BODY", body);
    const incident = await db.createIncident(body);
    res.json(incident);
  };
};
