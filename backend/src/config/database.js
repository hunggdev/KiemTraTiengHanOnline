import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing!");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Tăng lên 20 để đủ client riêng biệt cho các query đồng thời
  min: 2, // Giữ sẵn ít nhất 2 connection để giảm latency lần đầu
  idleTimeoutMillis: 10000, // Đóng connection idle sau 10s để tránh bị Supabase kill phía ngoài
  connectionTimeoutMillis: 10000, // Tăng lên 10s để chịu được latency cao VN → Singapore
  allowExitOnIdle: false, // Giữ pool sống khi không có request
  keepAlive: true, // Giữ TCP connection sống, tránh bị kill bởi firewall/Supabase
  ssl: { rejectUnauthorized: false }, // Bắt buộc với Supabase
});

// Bắt lỗi pool-level để tránh crash app khi connection bị terminated bất ngờ
pool.on("error", (err) => {
  console.error(
    "⚠️ PostgreSQL pool error (connection terminated):",
    err.message,
  );
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" && process.env.DEBUG_PRISMA === "true"
    ? ["query", "info", "warn", "error"]
    : ["warn", "error"],
});

export const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log("✅ PostgreSQL connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await prisma.$disconnect();
  await pool.end();
  console.log("🔌 Database disconnected.");
};
