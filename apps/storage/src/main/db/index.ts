import { CreateIncident, ReadIncident } from "../services/incidents";

export interface Db {
  getIncidents(): Promise<ReadIncident[]>;
  createIncident(incident: CreateIncident): Promise<ReadIncident>;
}
