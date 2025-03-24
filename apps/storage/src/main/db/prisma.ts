import { PrismaClient } from "@prisma/client";

import { CreateIncident, ReadIncident } from "../services/incidents";

import { Db, DbError } from ".";
import { err, PromisedResult, res } from "../utils/result";
import { ensureError } from "../utils/ensureError";

export class PrismaDb implements Db {
  constructor(private readonly client: PrismaClient) {}

  public async getIncidents(): PromisedResult<ReadIncident[], DbError> {
    return this.handleSafely(
      async () => await this.client.incident.findMany(),
      "There was a Prisma Error when getting incidents"
    );
  }

  public async getIncident(
    id: number
  ): PromisedResult<ReadIncident | null, DbError> {
    return this.handleSafely(
      async () => await this.client.incident.findUnique({ where: { id } }),
      "There was a Prisma Error when getting an incident"
    );
  }

  public async createIncident(
    incident: CreateIncident
  ): PromisedResult<ReadIncident, DbError> {
    return this.handleSafely(
      async () => await this.client.incident.create({ data: incident }),
      "There was a Prisma Error when creating an incident"
    );
  }

  private async handleSafely<T>(
    fn: () => Promise<T>,
    errorMessage: string
  ): PromisedResult<T, DbError> {
    try {
      return res(await fn());
    } catch (error) {
      const rootError = ensureError(error);
      return err(new DbError(errorMessage, rootError));
    }
  }
}

export const initPrismaDb = (): Db => {
  // Prisma doesn't fail on client instantiation, but it does when actually
  // making a connection for queries to the database
  const client = new PrismaClient();
  return new PrismaDb(client);
};
