import { when } from "jest-when";
import { ZodError } from "zod";

import { Db , DbError } from "../../../main/db";
import {
  Incidents,
  ReadIncident,
  CreateIncident,
  PatchIncident,
} from "../../../main/services/incidents";
import { Logger } from "../../../main/utils/logger";


describe("Incidents", () => {
  let subject: Incidents;

  let mockDb: Db;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDb = {
      getIncidents: jest.fn(),
      getIncident: jest.fn(),
      createIncident: jest.fn(),
      updateIncident: jest.fn(),
      deleteIncident: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    subject = new Incidents(mockDb, mockLogger);
  });

  describe("get", () => {
    it("should return an incident using the id", async () => {
      // Arrange
      const incidentId = 1;

      const incident: ReadIncident = {
        id: incidentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Incident",
        description: "Test Description",
        status: "open",
      };

      when(mockDb.getIncident).calledWith(1).mockResolvedValue({
        data: incident,
        err: null,
      });

      // Act
      const { data, err } = await subject.get(incidentId);

      // Assert
      expect(data).toEqual(incident);
      expect(err).toBeNull();
    });

    it("should return null when incident not found", async () => {
      // Arrange
      when(mockDb.getIncident).calledWith(1).mockResolvedValue({
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
      const dbError = new DbError("Database is unavailable");
      when(mockDb.getIncident).calledWith(1).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.get(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(DbError);
      expect(err?.message).toBe("Database is unavailable");
    });

    it("should return a ZodError when data is corrupted", async () => {
      // Arrange
      const corruptedData = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Incident",
        description: "Test Description",
        status: "invalid",
      };

      when(mockDb.getIncident)
        .calledWith(1)
        .mockResolvedValue({
          data: corruptedData as ReadIncident,
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
    it("should return all incidents", async () => {
      // Arrange
      const incidents: ReadIncident[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Incident 1",
          description: "Test Description 1",
          status: "open",
        },
        {
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Incident 2",
          description: "Test Description 2",
          status: "closed",
        },
      ];

      when(mockDb.getIncidents).mockResolvedValue({
        data: incidents,
        err: null,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toEqual(incidents);
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const dbError = new DbError("Database is unavailable");
      when(mockDb.getIncidents).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(DbError);
      expect(err?.message).toBe("Database is unavailable");
    });

    it("should return a ZodError when data is corrupted", async () => {
      // Arrange
      const corruptedData = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Incident",
          description: "Test Description",
          status: "invalid",
        },
      ];

      when(mockDb.getIncidents).mockResolvedValue({
        data: corruptedData as ReadIncident[],
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
    it("should create and return an incident", async () => {
      // Arrange
      const newIncident: CreateIncident = {
        name: "New Incident",
        description: "Test Description",
        status: "open",
      };

      const createdIncident: ReadIncident = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newIncident,
      };

      when(mockDb.createIncident).calledWith(newIncident).mockResolvedValue({
        data: createdIncident,
        err: null,
      });

      // Act
      const { data, err } = await subject.create(newIncident);

      // Assert
      expect(data).toEqual(createdIncident);
      expect(err).toBeNull();
    });

    it("should return a ZodError when payload is invalid", async () => {
      // Arrange
      const invalidPayload = {
        name: 123, // Should be string
        description: "Test Description",
        status: "invalid-status", // Invalid status
      };

      // Act
      const { data, err } = await subject.create(invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newIncident: CreateIncident = {
        name: "New Incident",
        description: "Test Description",
        status: "open",
      };

      const dbError = new DbError("Creation failed");
      when(mockDb.createIncident).calledWith(newIncident).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.create(newIncident);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(DbError);
      expect(err?.message).toBe("Creation failed");
    });
  });

  describe("patch", () => {
    it("should update and return an incident", async () => {
      // Arrange
      const updateData: PatchIncident = {
        name: "Updated Name",
        status: "closed",
      };

      const updatedIncident: ReadIncident = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Updated Name",
        description: "Test Description",
        status: "closed",
      };

      when(mockDb.updateIncident).calledWith(1, updateData).mockResolvedValue({
        data: updatedIncident,
        err: null,
      });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toEqual(updatedIncident);
      expect(err).toBeNull();
    });

    it("should return null when incident not found", async () => {
      // Arrange
      const updateData: PatchIncident = {
        name: "Updated Name",
        status: "closed",
      };

      when(mockDb.updateIncident).calledWith(1, updateData).mockResolvedValue({
        data: null,
        err: null,
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
        status: "invalid-status", // Invalid status
      };

      // Act
      const { data, err } = await subject.patch(1, invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when update fails", async () => {
      // Arrange
      const updateData: PatchIncident = {
        name: "Updated Name",
        status: "closed",
      };

      const dbError = new DbError("Update failed");
      when(mockDb.updateIncident).calledWith(1, updateData).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(DbError);
      expect(err?.message).toBe("Update failed");
    });
  });

  describe("delete", () => {
    it("should delete an incident successfully", async () => {
      // Arrange
      when(mockDb.deleteIncident).calledWith(1).mockResolvedValue(null);

      // Act
      const result = await subject.delete(1);

      // Assert
      expect(result).toBeNull();
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const dbError = new DbError("Deletion failed");
      when(mockDb.deleteIncident).calledWith(1).mockResolvedValue(dbError);

      // Act
      const result = await subject.delete(1);

      // Assert
      expect(result).toBeInstanceOf(DbError);
      expect(result?.message).toBe("Deletion failed");
    });
  });
});
