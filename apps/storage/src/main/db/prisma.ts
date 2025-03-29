import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import {
  CreateIncident,
  PatchIncident,
  ReadIncident,
} from "../services/incidents";
import { ensureError } from "../utils/ensureError";
import { err, PromisedResult, res, PromisedQuery } from "../utils/result";

import { Db, UnknownDbError, MissingResourceError } from ".";

export class PrismaDb implements Db {
  constructor(private readonly client: PrismaClient) {}

  public async getIncidents(): PromisedResult<ReadIncident[], UnknownDbError> {
    return this.handleSafely(
      async () => await this.client.incident.findMany(),
      "There was a Prisma Error when getting incidents"
    );
  }

  public async getIncident(
    id: number
  ): PromisedResult<ReadIncident | null, UnknownDbError> {
    return this.handleSafely(
      async () => await this.client.incident.findUnique({ where: { id } }),
      "There was a Prisma Error when getting an incident"
    );
  }

  public async createIncident(
    incident: CreateIncident
  ): PromisedResult<ReadIncident, UnknownDbError> {
    return this.handleSafely(
      async () => await this.client.incident.create({ data: incident }),
      "There was a Prisma Error when creating an incident"
    );
  }

  public async updateIncident(
    id: number,
    incident: PatchIncident
  ): PromisedResult<ReadIncident | null, UnknownDbError> {
    return this.handleSafely(
      async () =>
        await this.client.incident.update({
          where: { id },
          data: incident,
        }),
      "There was a Prisma Error when updating an incident"
    );
  }

  public async deleteIncident(id: number): PromisedQuery<UnknownDbError> {
    const result = await this.handleSafely(async () => {
      await this.client.incident.delete({ where: { id } });
    }, "There was a Prisma Error when deleting an incident");

    return result.err;
  }

  private async handleSafely<T>(
    fn: () => Promise<T>,
    errorMessage: string
  ): PromisedResult<T, UnknownDbError> {
    try {
      return res(await fn());
    } catch (error) {
      const rootError = ensureError(error);

      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        return err(new MissingResourceError(errorMessage, rootError));
      }

      return err(new UnknownDbError(errorMessage, rootError));
    }
  }
}

export const initPrismaDb = (url: string): Db => {
  // Prisma doesn't fail on client instantiation, but it does when actually
  // making a connection for queries to the database
  const client = new PrismaClient({ datasources: { db: { url } } });
  return new PrismaDb(client);
};
