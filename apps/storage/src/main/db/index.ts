import { CreateAlert, PatchAlert , ReadAlert } from "../services/alerts";
import {
  CreateIncident,
  PatchIncident,
  ReadIncident,
} from "../services/incidents";
import { CreateService, PatchService, ReadService } from "../services/services";
import { PromisedResult, PromisedQuery } from "../utils/result";

export interface IncidentsDb {
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

export interface ServicesDb {
  getServices(): PromisedResult<ReadService[], UnknownDbError>;
  getService(id: number): PromisedResult<ReadService | null, UnknownDbError>;
  createService(
    service: CreateService
  ): PromisedResult<ReadService, UnknownDbError>;
  updateService(
    id: number,
    service: PatchService
  ): PromisedResult<ReadService | null, UnknownDbError>;
  deleteService(id: number): PromisedQuery<UnknownDbError>;
}

export interface AlertsDb {
  getAlerts(): PromisedResult<ReadAlert[], UnknownDbError>;
  getAlert(id: number): PromisedResult<ReadAlert | null, UnknownDbError>;
  createAlert(alert: CreateAlert): PromisedResult<ReadAlert, UnknownDbError>;
  updateAlert(
    id: number,
    alert: PatchAlert
  ): PromisedResult<ReadAlert | null, UnknownDbError>;
  deleteAlert(id: number): PromisedQuery<UnknownDbError>;
}

export interface Db extends IncidentsDb, ServicesDb, AlertsDb {}

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
