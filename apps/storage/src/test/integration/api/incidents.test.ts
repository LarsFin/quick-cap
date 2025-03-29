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

    it("should return 401 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/incidents")
        .set("Authorization", "Bearer invalid-token");
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

    it("should return 404 if incident not found", async () => {
      const response = await request(app)
        .get("/api/v1/incidents/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Incident not found" });
    });

    it("should return 400 if invalid id is provided", async () => {
      const response = await request(app)
        .get("/api/v1/incidents/invalid-id")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/incidents/1");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/incidents", () => {
    it("should create a new incident", async () => {
      const newIncident = {
        name: "New Incident",
        description: "Test Description",
        status: "open",
      };

      const response = await request(app)
        .post("/api/v1/incidents")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(newIncident);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newIncident);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      const incident = await prisma.incident.findUnique({
        where: { id: response.body.id },
      });

      expect(incident).not.toBeNull();
      expect(incident?.name).toBe(newIncident.name);
      expect(incident?.description).toBe(newIncident.description);
    });

    it("should return 400 if invalid data is provided", async () => {
      const invalidIncident = {
        name: 123, // Should be string
        description: "Test Description",
        status: "invalid-status", // Invalid status
      };

      const response = await request(app)
        .post("/api/v1/incidents")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(invalidIncident);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).post("/api/v1/incidents").send({
        name: "New Incident",
        description: "Test Description",
        status: "open",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/incidents/:id", () => {
    it("should update an existing incident", async () => {
      const updateData = {
        name: "Updated Name",
        status: "closed",
      };

      const response = await request(app)
        .patch("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        ...updateData,
      });
    });

    it("should return 404 if incident not found", async () => {
      const response = await request(app)
        .patch("/api/v1/incidents/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          name: "Updated Name",
          status: "closed",
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Incident not found" });
    });

    it("should return 400 if invalid data is provided", async () => {
      const response = await request(app)
        .patch("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          status: "invalid-status",
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).patch("/api/v1/incidents/1").send({
        name: "Updated Name",
        status: "closed",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/incidents/:id", () => {
    it("should delete an existing incident", async () => {
      const response = await request(app)
        .delete("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);

      // Verify the incident was deleted
      const getResponse = await request(app)
        .get("/api/v1/incidents/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(getResponse.status).toBe(404);
    });

    it("should return 204 even if incident doesn't exist (idempotency)", async () => {
      const response = await request(app)
        .delete("/api/v1/incidents/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);
    });

    it("should return 400 if invalid id is provided", async () => {
      const response = await request(app)
        .delete("/api/v1/incidents/invalid-id")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).delete("/api/v1/incidents/1");
      expect(response.status).toBe(401);
    });
  });
});
