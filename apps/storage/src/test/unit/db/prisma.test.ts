import { PrismaClient } from "@prisma/client";
import { when } from "jest-when";

import { PrismaDb } from "../../../main/db/prisma";
import { ReadIncident } from "../../../main/services/incidents";
import { DbError } from "../../../main/db";

describe("PrismaDb", () => {
  let subject: PrismaDb;

  let mockPrismaClient: PrismaClient;

  beforeEach(() => {
    mockPrismaClient = {
      incident: {
        findMany: jest.fn(),
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
        } as ReadIncident,
        {
          id: 2,
        } as ReadIncident,
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
        expect(err).toBeInstanceOf(DbError);
        expect(err?.rootError).toEqual(rootError);
      });
    });
  });
});
