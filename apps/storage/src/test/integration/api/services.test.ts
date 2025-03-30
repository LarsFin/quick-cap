import { PrismaClient } from "@prisma/client";
import { Express } from "express";
import request from "supertest";

import { setup } from "..";
import { Config } from "../../../main/utils/config";

describe("Services", () => {
  let app: Express;
  let config: Config;
  let prisma: PrismaClient;

  beforeEach(async () => {
    ({ app, config, prisma } = await setup());
  });

  describe("GET /api/v1/services", () => {
    it("should return all stored services", async () => {
      const response = await request(app)
        .get("/api/v1/services")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body).toMatchObject([
        {
          name: "API Gateway",
          description: "Main API Gateway service",
        },
        {
          name: "User Service",
          description: "User management service",
        },
      ]);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/services");
      expect(response.status).toBe(401);
    });

    it("should return 401 if invalid token is provided", async () => {
      const response = await request(app)
        .get("/api/v1/services")
        .set("Authorization", "Bearer invalid-token");
      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/v1/services/:id", () => {
    it("should return the service with the given id", async () => {
      const response = await request(app)
        .get("/api/v1/services/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        name: "API Gateway",
      });
    });

    it("should return 404 if service not found", async () => {
      const response = await request(app)
        .get("/api/v1/services/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Service not found" });
    });

    it("should return 400 if invalid id is provided", async () => {
      const response = await request(app)
        .get("/api/v1/services/invalid-id")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).get("/api/v1/services/1");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/v1/services", () => {
    it("should create a new service", async () => {
      const newService = {
        name: "New Service",
        description: "Test Description",
      };

      const response = await request(app)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(newService);

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject(newService);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body).toHaveProperty("updatedAt");

      const service = await prisma.service.findUnique({
        where: { id: response.body.id },
      });

      expect(service).not.toBeNull();
      expect(service?.name).toBe(newService.name);
      expect(service?.description).toBe(newService.description);
    });

    it("should return 400 if invalid data is provided", async () => {
      const invalidService = {
        name: 123, // Should be string
        description: "Test Description",
      };

      const response = await request(app)
        .post("/api/v1/services")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(invalidService);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).post("/api/v1/services").send({
        name: "New Service",
        description: "Test Description",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/services/:id", () => {
    it("should update an existing service", async () => {
      const updateData = {
        name: "Updated Name",
        description: "Updated Description",
      };

      const response = await request(app)
        .patch("/api/v1/services/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: 1,
        ...updateData,
      });
    });

    it("should return 404 if service not found", async () => {
      const response = await request(app)
        .patch("/api/v1/services/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          name: "Updated Name",
          description: "Updated Description",
        });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Service not found" });
    });

    it("should return 400 if invalid data is provided", async () => {
      const response = await request(app)
        .patch("/api/v1/services/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`)
        .send({
          name: 123, // Should be string
        });

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).patch("/api/v1/services/1").send({
        name: "Updated Name",
        description: "Updated Description",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("DELETE /api/v1/services/:id", () => {
    it("should delete an existing service", async () => {
      const response = await request(app)
        .delete("/api/v1/services/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);

      // Verify the service was deleted
      const getResponse = await request(app)
        .get("/api/v1/services/1")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(getResponse.status).toBe(404);
    });

    it("should return 204 even if service doesn't exist (idempotency)", async () => {
      const response = await request(app)
        .delete("/api/v1/services/999")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(204);
    });

    it("should return 400 if invalid id is provided", async () => {
      const response = await request(app)
        .delete("/api/v1/services/invalid-id")
        .set("Authorization", `Bearer ${config.API_TOKEN}`);

      expect(response.status).toBe(400);
    });

    it("should return 401 if no token is provided", async () => {
      const response = await request(app).delete("/api/v1/services/1");
      expect(response.status).toBe(401);
    });
  });
});
