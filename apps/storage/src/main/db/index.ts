import { CreateIncident, ReadIncident } from "../services/incidents";

export interface Db {
  getIncidents(): Promise<ReadIncident[]>;
  getIncident(id: number): Promise<ReadIncident | null>;
  createIncident(incident: CreateIncident): Promise<ReadIncident>;
}
