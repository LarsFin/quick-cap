import {
  CreateIncident,
  PatchIncident,
  ReadIncident,
} from "../services/incidents";
import { PromisedResult, PromisedQuery } from "../utils/result";

export interface Db {
  getIncidents(): PromisedResult<ReadIncident[], UnknownDbError>;
  getIncident(id: number): PromisedResult<ReadIncident | null, UnknownDbError>;
  createIncident(
    incident: CreateIncident
  ): PromisedResult<ReadIncident, UnknownDbError>;
  updateIncident(
    id: number,
    incident: PatchIncident
  ): PromisedResult<ReadIncident | null, UnknownDbError>;
  deleteIncident(id: number): PromisedQuery<UnknownDbError>;
}

export class UnknownDbError extends Error {
  constructor(
    message: string,
    public readonly rootError?: Error
  ) {
    super(message);
    this.name = "DbError";
  }
}

export class MissingResourceError extends UnknownDbError {}
