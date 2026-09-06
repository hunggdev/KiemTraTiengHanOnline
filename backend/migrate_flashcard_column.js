import prisma from "./src/prisma.js";

async function main() {
  try {
    console.log("Adding canAccessFlashcard column to User table...");
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canAccessFlashcard" BOOLEAN DEFAULT false;`
    );
    console.log("✅ Successfully added canAccessFlashcard column to User table in PostgreSQL DB!");
    
    // Verify
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        canAccessFlashcard: true,
      },
    });
    console.log("Verified User query with canAccessFlashcard:", user);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration error:", err);
    process.exit(1);
  }
}

main();
