import { z, ZodError } from "zod";
import { Db } from "../db";
import { err, PromisedResult, res } from "../utils/result";

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
  constructor(private readonly db: Db) {}

  public async getAll(): PromisedResult<ReadIncident[], ZodError> {
    const incidents = await this.db.getIncidents();

    for (const incident of incidents) {
      const parsed = readIncidentSchema.safeParse(incident);

      if (!parsed.success) {
        return err(parsed.error);
      }
    }

    return res(incidents);
  }

  public async create(
    payload: unknown
  ): PromisedResult<ReadIncident, ZodError> {
    const parsed = createIncidentSchema.safeParse(payload);

    if (!parsed.success) {
      return err(parsed.error);
    }

    const incident = await this.db.createIncident(parsed.data);
    return res(readIncidentSchema.parse(incident));
  }
}
