import { when } from "jest-when";
import { ZodError } from "zod";

import {
  AlertsDb,
  MissingResourceError,
  UnknownDbError,
} from "../../../main/db";
import {
  Alerts,
  ReadAlert,
  CreateAlert,
  PatchAlert,
} from "../../../main/services/alerts";
import { Logger } from "../../../main/utils/logger";

describe("Alerts", () => {
  let subject: Alerts;
  let mockDb: AlertsDb;
  let mockLogger: Logger;

  beforeEach(() => {
    mockDb = {
      getAlerts: jest.fn(),
      getAlert: jest.fn(),
      createAlert: jest.fn(),
      updateAlert: jest.fn(),
      deleteAlert: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as Logger;

    subject = new Alerts(mockDb, mockLogger);
  });

  describe("get", () => {
    it("should return an alert using the id", async () => {
      // Arrange
      const alertId = 1;
      const alert: ReadAlert = {
        id: alertId,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Alert",
        description: "Test Description",
        incidentId: null,
        serviceId: null,
      };

      when(mockDb.getAlert).calledWith(1).mockResolvedValue({
        data: alert,
        err: null,
      });

      // Act
      const { data, err } = await subject.get(alertId);

      // Assert
      expect(data).toEqual(alert);
      expect(err).toBeNull();
    });

    it("should return null when alert not found", async () => {
      // Arrange
      when(mockDb.getAlert).calledWith(1).mockResolvedValue({
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
      when(mockDb.getAlert).calledWith(1).mockResolvedValue({
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
        incidentId: 1,
        serviceId: 1,
      } as unknown as ReadAlert;

      when(mockDb.getAlert).calledWith(1).mockResolvedValue({
        data: corruptedData,
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
    it("should return all alerts", async () => {
      // Arrange
      const alerts: ReadAlert[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Alert 1",
          description: "Test Description 1",
          incidentId: null,
          serviceId: null,
        },
        {
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Alert 2",
          description: "Test Description 2",
          incidentId: null,
          serviceId: null,
        },
      ];

      when(mockDb.getAlerts).mockResolvedValue({
        data: alerts,
        err: null,
      });

      // Act
      const { data, err } = await subject.getAll();

      // Assert
      expect(data).toEqual(alerts);
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const dbError = new UnknownDbError("Database is unavailable");
      when(mockDb.getAlerts).mockResolvedValue({
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
      ] as unknown as ReadAlert[];

      when(mockDb.getAlerts).mockResolvedValue({
        data: corruptedData,
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
    it("should create and return an alert", async () => {
      // Arrange
      const newAlert: CreateAlert = {
        name: "New Alert",
        description: "Test Description",
        incidentId: 1,
        serviceId: 1,
      };

      const createdAlert: ReadAlert = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "New Alert",
        description: "Test Description",
        incidentId: null,
        serviceId: null,
      };

      when(mockDb.createAlert).calledWith(newAlert).mockResolvedValue({
        data: createdAlert,
        err: null,
      });

      // Act
      const { data, err } = await subject.create(newAlert);

      // Assert
      expect(data).toEqual(createdAlert);
      expect(err).toBeNull();
    });

    it("should return a ZodError when payload is invalid", async () => {
      // Arrange
      const invalidPayload = {
        name: 123, // Should be string
        description: "Test Description",
        incidentId: "invalid", // Should be number
        serviceId: "invalid", // Should be number
      };

      // Act
      const { data, err } = await subject.create(invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newAlert: CreateAlert = {
        name: "New Alert",
        description: "Test Description",
        incidentId: 1,
        serviceId: 1,
      };

      const dbError = new UnknownDbError("Creation failed");
      when(mockDb.createAlert).calledWith(newAlert).mockResolvedValue({
        data: null,
        err: dbError,
      });

      // Act
      const { data, err } = await subject.create(newAlert);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Creation failed");
    });
  });

  describe("patch", () => {
    it("should update and return an alert", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };

      const updatedAlert: ReadAlert = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Updated Name",
        description: "Updated Description",
        incidentId: null,
        serviceId: null,
      };

      when(mockDb.updateAlert).calledWith(1, updateData).mockResolvedValue({
        data: updatedAlert,
        err: null,
      });

      // Act
      const { data, err } = await subject.patch(1, updateData);

      // Assert
      expect(data).toEqual(updatedAlert);
      expect(err).toBeNull();
    });

    it("should return null when alert not found", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };

      when(mockDb.updateAlert)
        .calledWith(1, updateData)
        .mockResolvedValue({
          data: null,
          err: new MissingResourceError("Alert not found"),
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
        incidentId: "invalid", // Should be number
        serviceId: "invalid", // Should be number
      };

      // Act
      const { data, err } = await subject.patch(1, invalidPayload);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(ZodError);
    });

    it("should return a DbError when update fails", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };

      const dbError = new UnknownDbError("Update failed");
      when(mockDb.updateAlert).calledWith(1, updateData).mockResolvedValue({
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
    it("should delete an alert successfully", async () => {
      // Arrange
      when(mockDb.deleteAlert).calledWith(1).mockResolvedValue(null);

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return ok when missing resource", async () => {
      // Arrange
      when(mockDb.deleteAlert)
        .calledWith(1)
        .mockResolvedValue(new MissingResourceError("Alert not found"));

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const dbError = new UnknownDbError("Deletion failed");
      when(mockDb.deleteAlert).calledWith(1).mockResolvedValue(dbError);

      // Act
      const err = await subject.delete(1);

      // Assert
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.message).toBe("Deletion failed");
    });
  });
});
