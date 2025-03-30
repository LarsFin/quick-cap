import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const main = async () => {
  await prisma.incident.createMany({
    data: [
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
    ],
  });

  await prisma.service.createMany({
    data: [
      {
        name: "API Gateway",
        description: "Main API Gateway service",
      },
      {
        name: "User Service",
        description: "User management service",
      },
    ],
  });

  await prisma.alert.createMany({
    data: [
      {
        name: "API Gateway Alert",
        description: "API Gateway service is experiencing high latency",
        serviceId: 1,
        incidentId: 1,
      },
      {
        name: "User Service Alert",
        description: "User service is experiencing high latency",
        serviceId: 2,
        incidentId: 1,
      },
    ],
  });
};

main()
  .then(() => {
    console.log("Database seeded successfully");
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
    process.exit(1);
  });
