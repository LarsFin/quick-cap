import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import request from "supertest";

import { setup } from "..";
import { Config } from "../../../main/utils/config";

describe("Incidents", () => {
  let app: Express;
  let config: Config;
  let prisma: PrismaClient;

  beforeEach(async () => {
    ({ app, config, prisma } = await setup());
  });

  describe("GET /api/v1/incidents", () => {
    it("should return all stored incidents", async () => {
      const response = await request(app)
        .get("/api/v1/incidents")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body).toMatchObject([
        {
          name: "Slow Response Times",
          description:
            "Response times have been longer than 5 seconds for the last 5 minutes.",
          status: "open",
        },
        {
          name: "High CPU Usage",
          description: "CPU usage has been above 80% for the last 10 minutes.",
          status: "open",
        },
      ]);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/incidents");
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/incidents/:id", () => {
    it("should return the incident with the given id", async () => {
      const response = await request(app)
        .get("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        name: "Slow Response Times",
      });
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/incidents/1");
      expect(response.status).toBe(401);
    });

    it("should return 404 if the incident does not exist", async () => {
      const response = await request(app)
        .get("/api/v1/incidents/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /api/v1/incidents", () => {
    it("should create a new incident", async () => {
      const response = await request(app)
        .post("/api/v1/incidents")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          name: "New Incident",
          description: "This is a new incident",
          status: "open",
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        id: 3,
        name: "New Incident",
        description: "This is a new incident",
        status: "open",
      });

      const incident = await prisma.incident.findUnique({
        where: { id: 3 },
      });

      expect(incident).not.toBeNull();
      expect(incident?.name).toBe("New Incident");
      expect(incident?.description).toBe("This is a new incident");
    });
  });

  describe("PATCH /api/v1/incidents/:id", () => {
    it("should update the incident with the given id", async () => {
      const response = await request(app)
        .patch("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          status: "closed",
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        status: "closed",
      });

      const incident = await prisma.incident.findUnique({
        where: { id: 1 },
      });

      expect(incident?.status).toBe("closed");
    });
  });

  describe("DELETE /api/v1/incidents/:id", () => {
    it("should delete the incident with the given id", async () => {
      const response = await request(app)
        .delete("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);

      const incident = await prisma.incident.findUnique({
        where: { id: 1 },
      });

      expect(incident).toBeNull();
    });
  });
});
