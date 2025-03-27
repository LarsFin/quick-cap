import { z, ZodError } from "zod";

import { Db, DbError } from "../db";
import { Logger } from "../utils/logger";
import { err, ok, PromisedQuery, PromisedResult, res } from "../utils/result";

const readIncidentSchema = z.strictObject({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["open", "closed"]),
});
export type ReadIncident = z.infer<typeof readIncidentSchema>;

const createIncidentSchema = z.strictObject({
  name: z.string(),
  description: z.string().nullable(),
  status: z.enum(["open", "closed"]),
});
export type CreateIncident = z.infer<typeof createIncidentSchema>;

const patchIncidentSchema = z.strictObject({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["open", "closed"]).optional(),
});
export type PatchIncident = z.infer<typeof patchIncidentSchema>;

export class Incidents {
  constructor(
    private readonly db: Db,
    private readonly logger: Logger
  ) {}

  public async get(id: number): PromisedResult<ReadIncident | null, Error> {
    const incidentQuery = await this.db.getIncident(id);

    if (incidentQuery.err !== null) {
      this.logger.error("Error getting incident", incidentQuery.err);
      return err(incidentQuery.err);
    }

    if (incidentQuery.data === null) {
      return res(null);
    }

    const parsed = readIncidentSchema.safeParse(incidentQuery.data);

    if (!parsed.success) {
      this.logger.error("Corrupted incident data in database", parsed.error);
      return err(parsed.error);
    }

    return res(parsed.data);
  }

  public async getAll(): PromisedResult<ReadIncident[], Error> {
    const incidentsQuery = await this.db.getIncidents();

    if (incidentsQuery.err !== null) {
      this.logger.error(
        "Error getting incidents from database",
        incidentsQuery.err
      );
      return err(incidentsQuery.err);
    }

    for (const incident of incidentsQuery.data) {
      const parsed = readIncidentSchema.safeParse(incident);

      if (!parsed.success) {
        this.logger.error("Corrupted incident data in database", parsed.error);
        return err(parsed.error);
      }
    }

    return res(incidentsQuery.data);
  }

  public async create(
    payload: unknown
  ): PromisedResult<ReadIncident, ZodError | DbError> {
    const parsed = createIncidentSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const incident = await this.db.createIncident(parsed.data);

    if (incident.err !== null) {
      this.logger.error("Error creating incident in database", incident.err);
      return err(incident.err);
    }

    return res(readIncidentSchema.parse(incident.data));
  }

  public async patch(
    id: number,
    payload: unknown
  ): PromisedResult<ReadIncident | null, ZodError | DbError> {
    const parsed = patchIncidentSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const incident = await this.db.updateIncident(id, parsed.data);

    if (incident.err !== null) {
      this.logger.error("Error updating incident in database", incident.err);
      return err(incident.err);
    }

    if (incident.data === null) {
      return res(null);
    }

    return res(readIncidentSchema.parse(incident.data));
  }

  public async delete(id: number): PromisedQuery<DbError> {
    const err = await this.db.deleteIncident(id);

    if (err !== null) {
      this.logger.error("Error deleting incident from database", err);
      return err;
    }

    return ok();
  }
}
