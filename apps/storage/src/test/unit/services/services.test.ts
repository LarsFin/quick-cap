import { when } from "jest-when";
import { ZodError } from "zod";

import {
  ServicesDb,
  MissingResourceError,
  UnknownDbError,
} from "../../../main/db";
import {
  Services,
  ReadService,
  CreateService,
  PatchService,
} from "../../../main/services/services";
import { Logger } from "../../../main/utils/logger";

describe("Services", () => {
  let subject: Services;
  let mockDb: ServicesDb;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDb = {
      getServices: jest.fn(),
      getService: jest.fn(),
      createService: jest.fn(),
      updateService: jest.fn(),
      deleteService: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    subject = new Services(mockDb, mockLogger);
  });

  describe("get", () => {
    it("should return a service using the id", async () => {
      // Arrange
      const serviceId = 1;
      const service: ReadService = {
        id: serviceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Service",
        description: "Test Description",
      };

      when(mockDb.getService).calledWith(1).mockResolvedValue({
        data: service,
        err: null,
      });

      // Act
      const { data, err } = await subject.get(serviceId);

      // Assert
      expect(data).toEqual(service);
      expect(err).toBeNull();
    });

    it("should return null when service not found", async () => {
      // Arrange
      when(mockDb.getService).calledWith(1).mockResolvedValue({
        data: null,
        err: null,
      });

      // Act
      const { data, err } = await subject.get(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const dbError = new UnknownDbError("Database is unavailable");
      when(mockDb.getService).calledWith(1).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.get(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Database is unavailable");
    });

    it("should return a ZodError when data is corrupted", async () => {
      // Arrange
      const corruptedData = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: 123, // Should be string
        description: "Test Description",
      };

      when(mockDb.getService)
        .calledWith(1)
        .mockResolvedValue({
          data: corruptedData as unknown as ReadService,
          err: null,
        });

      // Act
      const { data, err } = await subject.get(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });
  });

  describe("getAll", () => {
    it("should return all services", async () => {
      // Arrange
      const services: ReadService[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Service 1",
          description: "Test Description 1",
        },
        {
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Service 2",
          description: "Test Description 2",
        },
      ];

      when(mockDb.getServices).mockResolvedValue({
        data: services,
        err: null,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toEqual(services);
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const dbError = new UnknownDbError("Database is unavailable");
      when(mockDb.getServices).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Database is unavailable");
    });

    it("should return a ZodError when data is corrupted", async () => {
      // Arrange
      const corruptedData = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 123, // Should be string
          description: "Test Description",
        },
      ];

      when(mockDb.getServices).mockResolvedValue({
        data: corruptedData as unknown as ReadService[],
        err: null,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });
  });

  describe("create", () => {
    it("should create and return a service", async () => {
      // Arrange
      const newService: CreateService = {
        name: "New Service",
        description: "Test Description",
      };

      const createdService: ReadService = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newService,
      };

      when(mockDb.createService).calledWith(newService).mockResolvedValue({
        data: createdService,
        err: null,
      });

      // Act
      const { data, err } = await subject.create(newService);

      // Assert
      expect(data).toEqual(createdService);
      expect(err).toBeNull();
    });

    it("should return a ZodError when payload is invalid", async () => {
      // Arrange
      const invalidPayload = {
        name: 123, // Should be string
        description: "Test Description",
      };

      // Act
      const { data, err } = await subject.create(invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newService: CreateService = {
        name: "New Service",
        description: "Test Description",
      };

      const dbError = new UnknownDbError("Creation failed");
      when(mockDb.createService).calledWith(newService).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.create(newService);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Creation failed");
    });
  });

  describe("patch", () => {
    it("should update and return a service", async () => {
      // Arrange
      const updateData: PatchService = {
        name: "Updated Name",
        description: "Updated Description",
      };

      const updatedService: ReadService = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Updated Name",
        description: "Updated Description",
      };

      when(mockDb.updateService).calledWith(1, updateData).mockResolvedValue({
        data: updatedService,
        err: null,
      });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toEqual(updatedService);
      expect(err).toBeNull();
    });

    it("should return null when service not found", async () => {
      // Arrange
      const updateData: PatchService = {
        name: "Updated Name",
        description: "Updated Description",
      };

      when(mockDb.updateService)
        .calledWith(1, updateData)
        .mockResolvedValue({
          data: null,
          err: new MissingResourceError("Service not found"),
        });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeNull();
    });

    it("should return a ZodError when payload is invalid", async () => {
      // Arrange
      const invalidPayload = {
        name: 123, // Should be string
        description: "Test Description",
      };

      // Act
      const { data, err } = await subject.patch(1, invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when update fails", async () => {
      // Arrange
      const updateData: PatchService = {
        name: "Updated Name",
        description: "Updated Description",
      };

      const dbError = new UnknownDbError("Update failed");
      when(mockDb.updateService).calledWith(1, updateData).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Update failed");
    });
  });

  describe("delete", () => {
    it("should delete a service successfully", async () => {
      // Arrange
      when(mockDb.deleteService).calledWith(1).mockResolvedValue(null);

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return ok when missing resource", async () => {
      // Arrange
      when(mockDb.deleteService)
        .calledWith(1)
        .mockResolvedValue(new MissingResourceError("Service not found"));

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const dbError = new UnknownDbError("Deletion failed");
      when(mockDb.deleteService).calledWith(1).mockResolvedValue(dbError);

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Deletion failed");
    });
  });
});
