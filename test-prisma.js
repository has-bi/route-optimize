// test-prisma.js - Test Prisma client separately
console.log("🔍 TESTING PRISMA CLIENT DIRECTLY...");

try {
  console.log("🔍 Testing @prisma/client import...");
  const { PrismaClient } = require("@prisma/client");
  console.log("✅ PrismaClient import successful");

  console.log("🔍 Creating Prisma client instance...");
  const prisma = new PrismaClient();
  console.log("✅ Prisma client created");

  console.log("🔍 Testing database connection...");
  // Quick connection test
  prisma
    .$connect()
    .then(() => {
      console.log("✅ Database connection successful");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Database connection failed:", error.message);
      process.exit(1);
    });
} catch (error) {
  console.error("❌ Prisma test failed:", error.message);
  console.error("❌ Error details:", error);

  if (error.message.includes("generate")) {
    console.log("💡 Solution: Run 'npx prisma generate'");
  }

  if (error.message.includes("PrismaClient")) {
    console.log("💡 Solution: Run 'npm install @prisma/client'");
  }
}
