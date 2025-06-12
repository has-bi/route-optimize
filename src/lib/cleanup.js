import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function cleanupOldRoutes() {
  try {
    // Delete routes older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await prisma.route.deleteMany({
      where: {
        createdAt: {
          lt: oneMonthAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old routes`);
    return result.count;
  } catch (error) {
    console.error("Error cleaning up old routes:", error);
    return 0;
  }
}
