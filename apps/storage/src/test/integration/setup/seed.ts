import { PrismaClient } from "@prisma/client";

/**
 * This should be used to seed the base database so that any copies created for
 * isolated tests are created with the same data without having to run the seed
 * function again.
 */
export const seedTestDatabase = async (dbUrl: string) => {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

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

  await prisma.$disconnect();
};
