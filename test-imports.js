// test-imports.js - Test imports outside of middleware context
console.log("🔍 TESTING IMPORTS SEPARATELY...");

// Test 1: PrismaAdapter
console.log("Testing @auth/prisma-adapter...");
try {
  const prismaAdapter = require("@auth/prisma-adapter");
  console.log("✅ PrismaAdapter require() works");
  console.log("Available exports:", Object.keys(prismaAdapter));
} catch (error) {
  console.error("❌ PrismaAdapter require() failed:", error.message);
}

// Test 2: ES6 import of PrismaAdapter
console.log("Testing @auth/prisma-adapter ES6 import...");
import("@auth/prisma-adapter")
  .then((module) => {
    console.log("✅ PrismaAdapter ES6 import works");
    console.log("Available exports:", Object.keys(module));
  })
  .catch((error) => {
    console.error("❌ PrismaAdapter ES6 import failed:", error.message);
  });

// Test 3: Prisma client file
console.log("Testing ./src/lib/prisma.js...");
try {
  const prismaFile = require("./src/lib/prisma.js");
  console.log("✅ Prisma file require() works");
  console.log("Available exports:", Object.keys(prismaFile));
} catch (error) {
  console.error("❌ Prisma file require() failed:", error.message);
}

// Test 4: ES6 import of Prisma file
console.log("Testing ./src/lib/prisma.js ES6 import...");
import("./src/lib/prisma.js")
  .then((module) => {
    console.log("✅ Prisma file ES6 import works");
    console.log("Available exports:", Object.keys(module));
  })
  .catch((error) => {
    console.error("❌ Prisma file ES6 import failed:", error.message);
  });

setTimeout(() => {
  console.log("🔍 Test completed");
}, 1000);
