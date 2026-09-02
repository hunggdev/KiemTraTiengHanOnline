import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function reset() {
  console.log("Đang xóa các bảng cũ...");
  const client = await pool.connect();
  try {
    await client.query(`
      DROP TABLE IF EXISTS "Response" CASCADE;
      DROP TABLE IF EXISTS "TestAttempt" CASCADE;
      DROP TABLE IF EXISTS "TestAssignment" CASCADE;
      DROP TABLE IF EXISTS "Option" CASCADE;
      DROP TABLE IF EXISTS "Question" CASCADE;
      DROP TABLE IF EXISTS "TestSection" CASCADE;
      DROP TABLE IF EXISTS "Test" CASCADE;
      DROP TABLE IF EXISTS "User" CASCADE;
      DROP TABLE IF EXISTS "Class" CASCADE;
      DROP TYPE IF EXISTS "Role" CASCADE;
      DROP TYPE IF EXISTS "SkillType" CASCADE;
      DROP TYPE IF EXISTS "QuestionType" CASCADE;
    `);
    console.log("✅ Đã dọn dẹp sạch sẽ database!");
  } finally {
    client.release();
    await pool.end();
  }
}

reset().catch(console.error);
