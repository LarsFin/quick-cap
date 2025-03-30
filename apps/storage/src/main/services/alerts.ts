import { z, ZodError } from "zod";

import { AlertsDb, MissingResourceError } from "../db";
import { Logger } from "../utils/logger";
import { err, ok, PromisedQuery, PromisedResult, res } from "../utils/result";

const readAlertSchema = z.strictObject({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  description: z.string().nullable(),
  incidentId: z.number().nullable(),
  serviceId: z.number().nullable(),
});
export type ReadAlert = z.infer<typeof readAlertSchema>;

const createAlertSchema = z.strictObject({
  name: z.string(),
  description: z.string().optional(),
  incidentId: z.number().optional(),
  serviceId: z.number().optional(),
});
export type CreateAlert = z.infer<typeof createAlertSchema>;

const patchAlertSchema = z.strictObject({
  name: z.string().optional(),
  description: z.string().optional(),
  incidentId: z.number().optional(),
  serviceId: z.number().optional(),
});
export type PatchAlert = z.infer<typeof patchAlertSchema>;

export class Alerts {
  constructor(
    private readonly db: AlertsDb,
    private readonly logger: Logger
  ) {}

  public async getAll(): PromisedResult<ReadAlert[], Error> {
    const query = await this.db.getAlerts();

    if (query.err !== null) {
      this.logger.error("Error getting alerts from database", query.err);
      return err(query.err);
    }

    for (const alert of query.data) {
      const parsed = readAlertSchema.safeParse(alert);

      if (!parsed.success) {
        this.logger.error("Corrupted alert data in database", parsed.error);
        return err(parsed.error);
      }
    }

    return res(query.data);
  }

  public async get(id: number): PromisedResult<ReadAlert | null, Error> {
    const query = await this.db.getAlert(id);

    if (query.err !== null) {
      this.logger.error("Error getting alert", query.err);
      return err(query.err);
    }

    if (query.data === null) {
      return res(null);
    }

    const parsed = readAlertSchema.safeParse(query.data);

    if (!parsed.success) {
      this.logger.error("Corrupted alert data in database", parsed.error);
      return err(parsed.error);
    }

    return res(parsed.data);
  }

  public async create(
    payload: unknown
  ): PromisedResult<ReadAlert, ZodError | Error> {
    const parsed = createAlertSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const query = await this.db.createAlert(parsed.data);

    if (query.err !== null) {
      this.logger.error("Error creating alert in database", query.err);
      return err(query.err);
    }

    return res(readAlertSchema.parse(query.data));
  }

  public async patch(
    id: number,
    payload: unknown
  ): PromisedResult<ReadAlert | null, ZodError | Error> {
    const parsed = patchAlertSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const query = await this.db.updateAlert(id, parsed.data);

    if (query.err !== null) {
      if (query.err instanceof MissingResourceError) {
        return res(null);
      }

      this.logger.error("Error updating alert in database", query.err);
      return err(query.err);
    }

    if (query.data === null) {
      return res(null);
    }

    return res(readAlertSchema.parse(query.data));
  }

  public async delete(id: number): PromisedQuery<Error> {
    const err = await this.db.deleteAlert(id);

    if (err !== null) {
      if (err instanceof MissingResourceError) {
        return ok();
      }

      this.logger.error("Error deleting alert from database", err);
      return err;
    }

    return ok();
  }
}
