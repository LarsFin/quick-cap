import { PrismaClient } from "@prisma/client";

import { CreateIncident, ReadIncident } from "../services/incidents";

import { Db } from ".";

export class PrismaDb implements Db {
  constructor(private readonly client: PrismaClient) {}

  async getIncidents(): Promise<ReadIncident[]> {
    return this.client.incident.findMany();
  }

  async getIncident(id: number): Promise<ReadIncident | null> {
    return this.client.incident.findUnique({ where: { id } });
  }

  async createIncident(incident: CreateIncident): Promise<ReadIncident> {
    return this.client.incident.create({ data: incident });
  }
}

// TODO: figure out how to handle issues when instantiating the client,
// when does it fail?
export const initPrismaDb = (): Db => {
  const client = new PrismaClient();
  return new PrismaDb(client);
};
