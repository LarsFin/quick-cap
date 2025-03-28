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
