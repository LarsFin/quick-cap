import request from "supertest";

import { setup, TestApp } from "..";

describe("Incidents", () => {
  let testApp: TestApp;

  beforeEach(async () => {
    testApp = await setup();
  });

  describe("GET /api/v1/incidents", () => {
    it("should return all stored incidents", async () => {
      const response = await request(testApp.app)
        .get("/api/v1/incidents")
        .set("Authorization", `Bearer ${testApp.config.API_TOKEN}`);

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
      const response = await request(testApp.app).get("/api/v1/incidents");
      expect(response.status).toBe(401);
    });
  });
});
