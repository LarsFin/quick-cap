import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import request from "supertest";

import { setup } from "../../integration";

describe("Alerts", () => {
  let app: Express;
  let prisma: PrismaClient;
  let config: { API_TOKEN: string };

  beforeAll(async () => {
    const {
      app: testApp,
      prisma: testPrisma,
      config: testConfig,
    } = await setup();
    app = testApp;
    prisma = testPrisma;
    config = testConfig;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("GET /api/v1/alerts", () => {
    it("should return all alerts", async () => {
      const response = await request(app)
        .get("/api/v1/alerts")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("name");
      expect(response.body[0]).toHaveProperty("description");
      expect(response.body[0]).toHaveProperty("createdAt");
      expect(response.body[0]).toHaveProperty("updatedAt");
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/alerts");
      expect(response.status).toBe(401);
    });

    it("should return 401 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/alerts")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/alerts/:id", () => {
    it("should return an alert by id", async () => {
      const response = await request(app)
        .get("/api/v1/alerts/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("description");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");
    });

    it("should return 404 if alert not found", async () => {
      const response = await request(app)
        .get("/api/v1/alerts/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Alert not found");
    });

    it("should return 400 if invalid id format", async () => {
      const response = await request(app)
        .get("/api/v1/alerts/invalid")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/alerts/1");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/alerts", () => {
    it("should create a new alert", async () => {
      const newAlert = {
        name: "New Alert",
        description: "Test Description",
        incidentId: 1,
        serviceId: 1,
      };

      const response = await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(newAlert);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newAlert);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      const alert = await prisma.alert.findUnique({
        where: { id: response.body.id },
      });

      expect(alert).not.toBeNull();
      expect(alert?.name).toBe(newAlert.name);
      expect(alert?.description).toBe(newAlert.description);
    });

    it("should return 400 if invalid data is provided", async () => {
      const invalidAlert = {
        name: 123, // Should be string
        description: "Test Description",
        incidentId: "invalid", // Should be number
        serviceId: "invalid", // Should be number
      };

      const response = await request(app)
        .post("/api/v1/alerts")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(invalidAlert);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).post("/api/v1/alerts").send({
        name: "New Alert",
        description: "Test Description",
        incidentId: 1,
        serviceId: 1,
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/alerts/:id", () => {
    it("should update an existing alert", async () => {
      const updateData = {
        name: "Updated Alert",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };

      const response = await request(app)
        .patch("/api/v1/alerts/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject(updateData);
      expect(response.body).toHaveProperty("id", 1);
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      const alert = await prisma.alert.findUnique({
        where: { id: 1 },
      });

      expect(alert).not.toBeNull();
      expect(alert?.name).toBe(updateData.name);
      expect(alert?.description).toBe(updateData.description);
    });

    it("should return 404 if alert not found", async () => {
      const updateData = {
        name: "Updated Alert",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      };

      const response = await request(app)
        .patch("/api/v1/alerts/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Alert not found");
    });

    it("should return 400 if invalid data is provided", async () => {
      const invalidData = {
        name: 123, // Should be string
        description: "Test Description",
        incidentId: "invalid", // Should be number
        serviceId: "invalid", // Should be number
      };

      const response = await request(app)
        .patch("/api/v1/alerts/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(invalidData);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).patch("/api/v1/alerts/1").send({
        name: "Updated Alert",
        description: "Updated Description",
        incidentId: 2,
        serviceId: 2,
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/alerts/:id", () => {
    it("should delete an existing alert", async () => {
      const response = await request(app)
        .delete("/api/v1/alerts/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);

      const alert = await prisma.alert.findUnique({
        where: { id: 1 },
      });

      expect(alert).toBeNull();
    });

    it("should return 204 if alert not found", async () => {
      const response = await request(app)
        .delete("/api/v1/alerts/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);
    });

    it("should return 400 if invalid id format", async () => {
      const response = await request(app)
        .delete("/api/v1/alerts/invalid")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).delete("/api/v1/alerts/1");
      expect(response.status).toBe(401);
    });
  });
});
