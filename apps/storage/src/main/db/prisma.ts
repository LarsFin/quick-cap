import { PrismaClient } from "@prisma/client";
import { Db, Incident } from ".";

export class PrismaDb implements Db {
  constructor(private readonly client: PrismaClient) {}

  async getIncidents(): Promise<Incident[]> {
    return this.client.incident.findMany();
  }

  async createIncident(incident: Incident): Promise<Incident> {
    return this.client.incident.create({ data: incident });
  }
}

// TODO: figure out how to handle issues when instantiating the client,
// when does it fail?
export const initPrismaDb = (): Db => {
  const client = new PrismaClient();
  return new PrismaDb(client);
};
