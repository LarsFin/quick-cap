import {
  CreateIncident,
  PatchIncident,
  ReadIncident,
} from "../services/incidents";
import { PromisedResult } from "../utils/result";

export interface Db {
  getIncidents(): PromisedResult<ReadIncident[], DbError>;
  getIncident(id: number): PromisedResult<ReadIncident | null, DbError>;
  createIncident(
    incident: CreateIncident
  ): PromisedResult<ReadIncident, DbError>;
  updateIncident(
    id: number,
    incident: PatchIncident
  ): PromisedResult<ReadIncident | null, DbError>;
  deleteIncident(id: number): PromisedResult<void, DbError>;
}

export class DbError extends Error {
  constructor(
    message: string,
    public readonly rootError?: Error
  ) {
    super(message);
    this.name = "DbError";
  }
}
