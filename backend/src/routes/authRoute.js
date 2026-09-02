import express from "express";
import {
  signUp,
  signIn,
  signOut,
  getMe,
} from "../controllers/authController.js";

const router = express.Router();

// POST /api/auth/signup  - Đăng ký tài khoản (mặc định STUDENT)
router.post("/signup", signUp);

// POST /api/auth/signin  - Đăng nhập
router.post("/signin", signIn);

// POST /api/auth/signout - Đăng xuất
router.post("/signout", signOut);

// GET  /api/auth/me      - Lấy thông tin user hiện tại
router.get("/me", getMe);

export default router;
