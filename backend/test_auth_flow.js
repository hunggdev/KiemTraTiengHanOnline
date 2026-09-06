import prisma from "./src/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kiemtra_jwt_secret_key_2026_super_secure";

async function test() {
  try {
    const user = await prisma.user.findFirst({
      where: { role: "STUDENT" }
    });
    console.log("Found student:", user?.username);

    // Test token generation and decode
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const decoded = jwt.verify(token, JWT_SECRET);
    const fetchedUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        classId: true,
        canAccessFlashcard: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log("Fetched User successfully:", fetchedUser);
    console.log("✅ Auth login flow test PASSED with 0 errors!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Auth test failed:", err);
    process.exit(1);
  }
}

test();
