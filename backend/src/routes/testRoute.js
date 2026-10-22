import express from "express";
import {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  togglePublishTest,
  getTestForTaking,
  submitTestAttempt,
  getTestStats,
  getTestAttempts,
  getAttemptDetail,
  gradeAttempt,
} from "../controllers/testController.js";
import {
  getMyAttempts,
  getMyAttemptDetail,
} from "../controllers/studentTestController.js";
import { verifyAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ─── HỌC SINH: Lịch sử thi cá nhân (Đặt trước /:id) ──────────────────────────
router.get("/my/attempts", verifyAuth, getMyAttempts);
router.get("/my/attempts/:attemptId", verifyAuth, getMyAttemptDetail);

// ─── TEACHER-ONLY: quản lý đề thi ────────────────────────────────────────────

// POST   /api/tests          - Tạo bài test mới (chỉ TEACHER)
router.post("/", verifyAuth, requireRole("TEACHER"), createTest);

// PUT    /api/tests/:id      - Cập nhật bài test (chỉ TEACHER)
router.put("/:id", verifyAuth, requireRole("TEACHER"), updateTest);

// DELETE /api/tests/:id      - Xóa bài test (chỉ TEACHER)
router.delete("/:id", verifyAuth, requireRole("TEACHER"), deleteTest);

// PATCH  /api/tests/:id/publish - Bật/Tắt trạng thái xuất bản (chỉ TEACHER)
router.patch("/:id/publish", verifyAuth, requireRole("TEACHER"), togglePublishTest);

// ─── TEACHER-ONLY: xem kết quả & chấm bài ────────────────────────────────────

// GET    /api/tests/attempts/:attemptId - Chi tiết bài làm của 1 học sinh (chỉ TEACHER)
router.get("/attempts/:attemptId", verifyAuth, requireRole("TEACHER"), getAttemptDetail);

// POST   /api/tests/attempts/:attemptId/grade - Chấm điểm tự luận (chỉ TEACHER)
router.post("/attempts/:attemptId/grade", verifyAuth, requireRole("TEACHER"), gradeAttempt);

// GET    /api/tests/:id/stats  - Thống kê số liệu bài thi (chỉ TEACHER)
router.get("/:id/stats", verifyAuth, requireRole("TEACHER"), getTestStats);

// GET    /api/tests/:id/attempts - Danh sách bài làm của học sinh (chỉ TEACHER)
router.get("/:id/attempts", verifyAuth, requireRole("TEACHER"), getTestAttempts);

// ─── READ-ONLY: dành cho tất cả user đã đăng nhập ────────────────────────────

// GET    /api/tests          - Lấy danh sách bài test (hỗ trợ phân trang, tìm kiếm)
router.get("/", verifyAuth, getAllTests);

// GET    /api/tests/:id      - Lấy chi tiết 1 bài test (kèm đáp án - chỉ TEACHER dùng)
router.get("/:id", verifyAuth, requireRole("TEACHER"), getTestById);

// ─── HỌC SINH làm bài ────────────────────────────────────────────────────────

// GET    /api/tests/:id/take - Lấy đề thi để làm (ẩn đáp án đúng) - yêu cầu đăng nhập
router.get("/:id/take", verifyAuth, getTestForTaking);

// POST   /api/tests/:id/submit - Nộp bài thi - yêu cầu đăng nhập
router.post("/:id/submit", verifyAuth, submitTestAttempt);

export default router;
