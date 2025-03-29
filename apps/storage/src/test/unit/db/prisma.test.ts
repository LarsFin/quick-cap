import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { when } from "jest-when";

import { MissingResourceError, UnknownDbError } from "../../../main/db";
import { PrismaDb } from "../../../main/db/prisma";
import {
  ReadIncident,
  CreateIncident,
  PatchIncident,
} from "../../../main/services/incidents";

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
});
