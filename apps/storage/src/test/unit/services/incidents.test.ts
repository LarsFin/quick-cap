import { when } from "jest-when";
import { Db } from "../../../main/db";
import { Incidents, ReadIncident } from "../../../main/services/incidents";
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
  });
});
