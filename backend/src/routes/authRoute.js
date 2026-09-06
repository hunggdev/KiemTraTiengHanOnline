import express from "express";
import {
  signUp,
  signIn,
  signOut,
  getMe,
  getStudentsList,
  updateFlashcardPermission,
  batchUpdateFlashcardPermissions,
} from "../controllers/authController.js";
import { verifyAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST /api/auth/signup  - Đăng ký tài khoản (mặc định STUDENT)
router.post("/signup", signUp);

// POST /api/auth/signin  - Đăng nhập
router.post("/signin", signIn);

// POST /api/auth/signout - Đăng xuất
router.post("/signout", signOut);

// GET  /api/auth/me      - Lấy thông tin user hiện tại
router.get("/me", getMe);

// GET  /api/auth/students - Danh sách học sinh (chỉ dành cho TEACHER)
router.get("/students", verifyAuth, requireRole("TEACHER"), getStudentsList);

// PATCH /api/auth/students/:id/flashcard-permission - Cấp/thu hồi quyền cho 1 học sinh (TEACHER)
router.patch("/students/:id/flashcard-permission", verifyAuth, requireRole("TEACHER"), updateFlashcardPermission);

// POST /api/auth/students/flashcard-permissions - Cấp/thu hồi quyền hàng loạt (TEACHER)
router.post("/students/flashcard-permissions", verifyAuth, requireRole("TEACHER"), batchUpdateFlashcardPermissions);

export default router;
