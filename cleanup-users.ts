import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    console.log("🔍 Checking for user/account issues...");

    // Find all users
    const users = await prisma.user.findMany({
      include: {
        accounts: true,
      },
    });

    console.log(`Found ${users.length} users:`);

    users.forEach((user) => {
      console.log(`\n📧 ${user.email} (ID: ${user.id})`);
      console.log(`  Accounts: ${user.accounts.length}`);

      user.accounts.forEach((account) => {
        console.log(`  - ${account.provider}: ${account.providerAccountId}`);
      });
    });

    // Check for potential issues
    const duplicateEmails = users.filter(
      (user, index, arr) =>
        arr.findIndex((u) => u.email === user.email) !== index
    );

    if (duplicateEmails.length > 0) {
      console.log("\n⚠️ Duplicate emails found:");
      duplicateEmails.forEach((user) => {
        console.log(`  - ${user.email} (ID: ${user.id})`);
      });
    }

    // Look for cross-linked accounts
    const accounts = await prisma.account.findMany({
      include: {
        user: true,
      },
    });

    console.log("\n🔗 OAuth account linkings:");
    accounts.forEach((account) => {
      console.log(
        `  ${account.provider} account ${account.providerAccountId} → User: ${account.user.email}`
      );
    });
  } catch (error) {
    console.error("Cleanup error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();
