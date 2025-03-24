import { z, ZodError } from "zod";

import { Db, DbError } from "../db";
import { err, PromisedResult, res } from "../utils/result";
import { Logger } from "../utils/logger";

const readIncidentSchema = z.strictObject({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
});
export type ReadIncident = z.infer<typeof readIncidentSchema>;

const createIncidentSchema = z.strictObject({
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
});
export type CreateIncident = z.infer<typeof createIncidentSchema>;

export class Incidents {
  constructor(
    private readonly db: Db,
    private readonly logger: Logger
  ) {}

  public async get(id: number): PromisedResult<ReadIncident | null, Error> {
    const incident = await this.db.getIncident(id);

    if (incident.err !== null) {
      this.logger.error("Error getting incident", incident.err);
      return err(incident.err);
    }

    if (incident.data === null) {
      return res(null);
    }

    const parsed = readIncidentSchema.safeParse(incident);

    if (!parsed.success) {
      this.logger.error("Corrupted incident data in database", parsed.error);
      return err(parsed.error);
    }

    return res(parsed.data);
  }

  public async getAll(): PromisedResult<ReadIncident[], Error> {
    const incidents = await this.db.getIncidents();

    if (incidents.err !== null) {
      this.logger.error("Error getting incidents from database", incidents.err);
      return err(incidents.err);
    }

    for (const incident of incidents.data) {
      const parsed = readIncidentSchema.safeParse(incident);

      if (!parsed.success) {
        this.logger.error("Corrupted incident data in database", parsed.error);
        return err(parsed.error);
      }
    }

    return res(incidents.data);
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
}
