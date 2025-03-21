export interface Db {
  getIncidents(): Promise<Incident[]>;
  createIncident(incident: Incident): Promise<Incident>;
}

/**
 * model types, not sure how I feel about defining them here if they're already
 * defined in the prisma schema. But, I want to keep the db interface
 * separate from the prisma schema
 */

export type Incident = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
  status: string;
};
