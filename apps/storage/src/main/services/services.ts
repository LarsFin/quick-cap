import { z, ZodError } from "zod";

import { MissingResourceError, ServicesDb } from "../db";
import { Logger } from "../utils/logger";
import { ok, PromisedQuery, PromisedResult, res , err } from "../utils/result";


const readServiceSchema = z.strictObject({
  id: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
  description: z.string().nullable(),
});
export type ReadService = z.infer<typeof readServiceSchema>;

const createServiceSchema = z.strictObject({
  name: z.string(),
  description: z.string().nullable(),
});
export type CreateService = z.infer<typeof createServiceSchema>;

const patchServiceSchema = z.strictObject({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});
export type PatchService = z.infer<typeof patchServiceSchema>;

export class Services {
  constructor(
    private readonly db: ServicesDb,
    private readonly logger: Logger
  ) {}

  public async get(id: number): PromisedResult<ReadService | null, Error> {
    const serviceQuery = await this.db.getService(id);

    if (serviceQuery.err !== null) {
      this.logger.error("Error getting service", serviceQuery.err);
      return err(serviceQuery.err);
    }

    if (serviceQuery.data === null) {
      return res(null);
    }

    const parsed = readServiceSchema.safeParse(serviceQuery.data);

    if (!parsed.success) {
      this.logger.error("Corrupted service data in database", parsed.error);
      return err(parsed.error);
    }

    return res(parsed.data);
  }

  public async getAll(): PromisedResult<ReadService[], Error> {
    const servicesQuery = await this.db.getServices();

    if (servicesQuery.err !== null) {
      this.logger.error("Error getting services", servicesQuery.err);
      return err(servicesQuery.err);
    }

    for (const service of servicesQuery.data) {
      const parsed = readServiceSchema.safeParse(service);

      if (!parsed.success) {
        this.logger.error("Corrupted service data in database", parsed.error);
        return err(parsed.error);
      }
    }

    return res(servicesQuery.data);
  }

  public async create(
    payload: unknown
  ): PromisedResult<ReadService, ZodError | Error> {
    const parsed = createServiceSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const service = await this.db.createService(parsed.data);

    if (service.err !== null) {
      this.logger.error("Error creating service in database", service.err);
      return err(service.err);
    }

    return res(readServiceSchema.parse(service.data));
  }

  public async patch(
    id: number,
    payload: unknown
  ): PromisedResult<ReadService | null, ZodError | Error> {
    const parsed = patchServiceSchema.safeParse(payload);

    if (!parsed.success) {
      this.logger.debug("Invalid payload", parsed.error);
      return err(parsed.error);
    }

    const service = await this.db.updateService(id, parsed.data);

    if (service.err !== null) {
      if (service.err instanceof MissingResourceError) {
        return res(null);
      }

      this.logger.error("Error updating service in database", service.err);
      return err(service.err);
    }

    if (service.data === null) {
      return res(null);
    }

    return res(readServiceSchema.parse(service.data));
  }

  public async delete(id: number): PromisedQuery<Error> {
    const err = await this.db.deleteService(id);

    if (err !== null) {
      if (err instanceof MissingResourceError) {
        return ok();
      }

      this.logger.error("Error deleting service from database", err);
      return err;
    }

    return ok();
  }
}
