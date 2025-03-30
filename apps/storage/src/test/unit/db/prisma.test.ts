import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { when } from "jest-when";

import { MissingResourceError, UnknownDbError } from "../../../main/db";
import { PrismaDb } from "../../../main/db/prisma";
import {
  ReadAlert,
  CreateAlert,
  PatchAlert,
} from "../../../main/services/alerts";
import {
  ReadIncident,
  CreateIncident,
  PatchIncident,
} from "../../../main/services/incidents";
import {
  ReadService,
  CreateService,
  PatchService,
} from "../../../main/services/services";

describe("PrismaDb", () => {
  let subject: PrismaDb;

  let mockPrismaClient: PrismaClient;

  beforeEach(() => {
    mockPrismaClient = {
      incident: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      service: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      alert: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    } as unknown as PrismaClient;

    subject = new PrismaDb(mockPrismaClient);
  });

  describe("getIncidents", () => {
    it("should return all incidents", async () => {
      // Arrange
      const storedIncidents: ReadIncident[] = [
        {
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Incident 1",
          description: null,
          status: "open",
        },
        {
          id: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Test Incident 2",
          description: "Test Description",
          status: "closed",
        },
      ];

      when(mockPrismaClient.incident.findMany).mockResolvedValue(
        storedIncidents
      );

      // Act
      const { data, err } = await subject.getIncidents();

      // Assert
      expect(data).toEqual(storedIncidents);
      expect(err).toBeNull();
    });

    describe("when the database is unavailable", () => {
      it("should return a DbError", async () => {
        // Arrange
        const rootError = new Error("Database is unavailable");
        when(mockPrismaClient.incident.findMany).mockRejectedValue(rootError);

        // Act
        const { data, err } = await subject.getIncidents();

        // Assert
        expect(data).toBeNull();
        expect(err).toBeInstanceOf(UnknownDbError);
        expect(err?.rootError).toEqual(rootError);
      });
    });
  });

  describe("getIncident", () => {
    it("should return an incident when found", async () => {
      // Arrange
      const storedIncident: ReadIncident = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Incident",
        description: null,
        status: "open",
      };

      when(mockPrismaClient.incident.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(storedIncident);

      // Act
      const { data, err } = await subject.getIncident(1);

      // Assert
      expect(data).toEqual(storedIncident);
      expect(err).toBeNull();
    });

    it("should return null when incident not found", async () => {
      // Arrange
      when(mockPrismaClient.incident.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(null);

      // Act
      const { data, err } = await subject.getIncident(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const rootError = new Error("Database is unavailable");
      when(mockPrismaClient.incident.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.getIncident(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("createIncident", () => {
    it("should create and return an incident", async () => {
      // Arrange
      const newIncident: CreateIncident = {
        name: "New Incident",
        description: null,
        status: "open",
      };
      const createdIncident: ReadIncident = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newIncident,
      };

      when(mockPrismaClient.incident.create)
        .calledWith({ data: newIncident })
        .mockResolvedValue(createdIncident);

      // Act
      const { data, err } = await subject.createIncident(newIncident);

      // Assert
      expect(data).toEqual(createdIncident);
      expect(err).toBeNull();
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newIncident: CreateIncident = {
        name: "New Incident",
        description: null,
        status: "open",
      };
      const rootError = new Error("Creation failed");
      when(mockPrismaClient.incident.create)
        .calledWith({ data: newIncident })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.createIncident(newIncident);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("updateIncident", () => {
    it("should update and return an incident when found", async () => {
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
        description: null,
        status: "closed",
      };

      when(mockPrismaClient.incident.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockResolvedValue(updatedIncident);

      // Act
      const { data, err } = await subject.updateIncident(1, updateData);

      // Assert
      expect(data).toEqual(updatedIncident);
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when incident not found", async () => {
      // Arrange
      const updateData: PatchIncident = {
        name: "Updated Name",
        status: "closed",
      };

      when(mockPrismaClient.incident.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to update not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const { data, err } = await subject.updateIncident(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when update fails for other reasons", async () => {
      // Arrange
      const updateData: PatchIncident = {
        name: "Updated Name",
        status: "closed",
      };
      const rootError = new Error("Update failed");
      when(mockPrismaClient.incident.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.updateIncident(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("deleteIncident", () => {
    it("should delete an incident successfully", async () => {
      // Arrange
      when(mockPrismaClient.incident.delete)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue({
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Deleted Incident",
          description: null,
          status: "closed",
        });

      // Act
      const err = await subject.deleteIncident(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when incident not found", async () => {
      // Arrange
      when(mockPrismaClient.incident.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to delete not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const err = await subject.deleteIncident(1);

      // Assert
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const rootError = new Error("Deletion failed");
      when(mockPrismaClient.incident.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const err = await subject.deleteIncident(1);

      // Assert
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("getServices", () => {
    it("should return all services", async () => {
      // Arrange
      const storedServices: ReadService[] = [
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

      when(mockPrismaClient.service.findMany).mockResolvedValue(storedServices);

      // Act
      const { data, err } = await subject.getServices();

      // Assert
      expect(data).toEqual(storedServices);
      expect(err).toBeNull();
    });

    describe("when the database is unavailable", () => {
      it("should return a DbError", async () => {
        // Arrange
        const rootError = new Error("Database is unavailable");
        when(mockPrismaClient.service.findMany).mockRejectedValue(rootError);

        // Act
        const { data, err } = await subject.getServices();

        // Assert
        expect(data).toBeNull();
        expect(err).toBeInstanceOf(UnknownDbError);
        expect(err?.rootError).toEqual(rootError);
      });
    });
  });

  describe("getService", () => {
    it("should return a service when found", async () => {
      // Arrange
      const storedService: ReadService = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Service",
        description: "Test Description",
      };

      when(mockPrismaClient.service.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(storedService);

      // Act
      const { data, err } = await subject.getService(1);

      // Assert
      expect(data).toEqual(storedService);
      expect(err).toBeNull();
    });

    it("should return null when service not found", async () => {
      // Arrange
      when(mockPrismaClient.service.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(null);

      // Act
      const { data, err } = await subject.getService(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const rootError = new Error("Database is unavailable");
      when(mockPrismaClient.service.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.getService(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("createService", () => {
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

      when(mockPrismaClient.service.create)
        .calledWith({ data: newService })
        .mockResolvedValue(createdService);

      // Act
      const { data, err } = await subject.createService(newService);

      // Assert
      expect(data).toEqual(createdService);
      expect(err).toBeNull();
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newService: CreateService = {
        name: "New Service",
        description: "Test Description",
      };
      const rootError = new Error("Creation failed");
      when(mockPrismaClient.service.create)
        .calledWith({ data: newService })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.createService(newService);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("updateService", () => {
    it("should update and return a service when found", async () => {
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

      when(mockPrismaClient.service.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockResolvedValue(updatedService);

      // Act
      const { data, err } = await subject.updateService(1, updateData);

      // Assert
      expect(data).toEqual(updatedService);
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when service not found", async () => {
      // Arrange
      const updateData: PatchService = {
        name: "Updated Name",
        description: "Updated Description",
      };

      when(mockPrismaClient.service.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to update not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const { data, err } = await subject.updateService(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when update fails for other reasons", async () => {
      // Arrange
      const updateData: PatchService = {
        name: "Updated Name",
        description: "Updated Description",
      };
      const rootError = new Error("Update failed");
      when(mockPrismaClient.service.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.updateService(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("deleteService", () => {
    it("should delete a service successfully", async () => {
      // Arrange
      when(mockPrismaClient.service.delete)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue({
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Deleted Service",
          description: "Test Description",
        });

      // Act
      const err = await subject.deleteService(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when service not found", async () => {
      // Arrange
      when(mockPrismaClient.service.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to delete not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const err = await subject.deleteService(1);

      // Assert
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const rootError = new Error("Deletion failed");
      when(mockPrismaClient.service.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const err = await subject.deleteService(1);

      // Assert
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("getAlerts", () => {
    it("should return all alerts", async () => {
      // Arrange
      const storedAlerts: ReadAlert[] = [
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

      when(mockPrismaClient.alert.findMany).mockResolvedValue(storedAlerts);

      // Act
      const { data, err } = await subject.getAlerts();

      // Assert
      expect(data).toEqual(storedAlerts);
      expect(err).toBeNull();
    });

    describe("when the database is unavailable", () => {
      it("should return a DbError", async () => {
        // Arrange
        const rootError = new Error("Database is unavailable");
        when(mockPrismaClient.alert.findMany).mockRejectedValue(rootError);

        // Act
        const { data, err } = await subject.getAlerts();

        // Assert
        expect(data).toBeNull();
        expect(err).toBeInstanceOf(UnknownDbError);
        expect(err?.rootError).toEqual(rootError);
      });
    });
  });

  describe("getAlert", () => {
    it("should return an alert when found", async () => {
      // Arrange
      const storedAlert: ReadAlert = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        name: "Test Alert",
        description: "Test Description",
        incidentId: null,
        serviceId: null,
      };

      when(mockPrismaClient.alert.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(storedAlert);

      // Act
      const { data, err } = await subject.getAlert(1);

      // Assert
      expect(data).toEqual(storedAlert);
      expect(err).toBeNull();
    });

    it("should return null when alert not found", async () => {
      // Arrange
      when(mockPrismaClient.alert.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue(null);

      // Act
      const { data, err } = await subject.getAlert(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeNull();
    });

    it("should return a DbError when database is unavailable", async () => {
      // Arrange
      const rootError = new Error("Database is unavailable");
      when(mockPrismaClient.alert.findUnique)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.getAlert(1);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("createAlert", () => {
    it("should create and return an alert", async () => {
      // Arrange
      const newAlert: CreateAlert = {
        name: "New Alert",
        description: "Test Description",
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

      when(mockPrismaClient.alert.create)
        .calledWith({ data: newAlert })
        .mockResolvedValue(createdAlert);

      // Act
      const { data, err } = await subject.createAlert(newAlert);

      // Assert
      expect(data).toEqual(createdAlert);
      expect(err).toBeNull();
    });

    it("should return a DbError when creation fails", async () => {
      // Arrange
      const newAlert: CreateAlert = {
        name: "New Alert",
        description: "Test Description",
      };
      const rootError = new Error("Creation failed");
      when(mockPrismaClient.alert.create)
        .calledWith({ data: newAlert })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.createAlert(newAlert);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("updateAlert", () => {
    it("should update and return an alert when found", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
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

      when(mockPrismaClient.alert.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockResolvedValue(updatedAlert);

      // Act
      const { data, err } = await subject.updateAlert(1, updateData);

      // Assert
      expect(data).toEqual(updatedAlert);
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when alert not found", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
      };

      when(mockPrismaClient.alert.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to update not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const { data, err } = await subject.updateAlert(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when update fails for other reasons", async () => {
      // Arrange
      const updateData: PatchAlert = {
        name: "Updated Name",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };
      const rootError = new Error("Update failed");
      when(mockPrismaClient.alert.update)
        .calledWith({
          where: { id: 1 },
          data: updateData,
        })
        .mockRejectedValue(rootError);

      // Act
      const { data, err } = await subject.updateAlert(1, updateData);

      // Assert
      expect(data).toBeNull();
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });

  describe("deleteAlert", () => {
    it("should delete an alert successfully", async () => {
      // Arrange
      when(mockPrismaClient.alert.delete)
        .calledWith({ where: { id: 1 } })
        .mockResolvedValue({
          id: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: "Deleted Alert",
          description: "Test Description",
          incidentId: 1,
          serviceId: 1,
        });

      // Act
      const err = await subject.deleteAlert(1);

      // Assert
      expect(err).toBeNull();
    });

    it("should return a MissingResourceError when alert not found", async () => {
      // Arrange
      when(mockPrismaClient.alert.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(
          new PrismaClientKnownRequestError("Record to delete not found.", {
            code: "P2025",
            clientVersion: "5.0.0",
          })
        );

      // Act
      const err = await subject.deleteAlert(1);

      // Assert
      expect(err).toBeInstanceOf(MissingResourceError);
    });

    it("should return a DbError when deletion fails", async () => {
      // Arrange
      const rootError = new Error("Deletion failed");
      when(mockPrismaClient.alert.delete)
        .calledWith({ where: { id: 1 } })
        .mockRejectedValue(rootError);

      // Act
      const err = await subject.deleteAlert(1);

      // Assert
      expect(err).toBeInstanceOf(UnknownDbError);
      expect(err?.rootError).toEqual(rootError);
    });
  });
});
