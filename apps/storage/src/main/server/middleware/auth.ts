import { NextFunction, Request, Response } from "express";

export type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export const challengeBearerToken = (bearerToken: string): AuthMiddleware => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader === undefined) {
      res.status(401).json({ error: "Missing API token" });
      return;
    }

    const [_, token] = authHeader.split(" ");

    if (token !== bearerToken) {
      res.status(401).json({ error: "Invalid API token" });
      return;
    }

    next();
  };
};
