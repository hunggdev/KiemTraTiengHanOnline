import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./config/database.js";
import authRoute from "./routes/authRoute.js";
import testRoute from "./routes/testRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile/curl/server-to-server) hoặc thuộc danh sách/vercel
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(null, true); // fallback cho phép trong production nếu có custom domain
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/tests", testRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Backend Server running at http://localhost:${PORT}`);
  });
});
