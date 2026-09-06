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
import { verifyAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST   /api/tests          - Tạo bài test mới
router.post("/", createTest);

// GET    /api/tests          - Lấy danh sách bài test (hỗ trợ phân trang, tìm kiếm)
router.get("/", getAllTests);

// GET    /api/tests/attempts/:attemptId - Chi tiết bài làm của 1 học sinh (chỉ dành cho giáo viên TEACHER)
router.get("/attempts/:attemptId", verifyAuth, requireRole("TEACHER"), getAttemptDetail);

// POST   /api/tests/attempts/:attemptId/grade - Chấm điểm bài tự luận và tổng kết điểm (chỉ dành cho giáo viên TEACHER)
router.post("/attempts/:attemptId/grade", verifyAuth, requireRole("TEACHER"), gradeAttempt);

// GET    /api/tests/:id/take - Lấy đề thi cho học sinh làm bài (ẩn đáp án đúng)
router.get("/:id/take", getTestForTaking);

// POST   /api/tests/:id/submit - Nộp bài thi và lưu vào DB (TestAttempt + Response)
router.post("/:id/submit", submitTestAttempt);

// GET    /api/tests/:id/stats  - Thống kê số liệu bài thi (chỉ dành cho giáo viên TEACHER)
router.get("/:id/stats", verifyAuth, requireRole("TEACHER"), getTestStats);

// GET    /api/tests/:id/attempts - Lấy danh sách bài làm của học sinh cho 1 bài kiểm tra (chỉ dành cho giáo viên TEACHER)
router.get("/:id/attempts", verifyAuth, requireRole("TEACHER"), getTestAttempts);

// GET    /api/tests/:id      - Lấy chi tiết 1 bài test
router.get("/:id", getTestById);

// PUT    /api/tests/:id      - Cập nhật bài test
router.put("/:id", updateTest);

// DELETE /api/tests/:id      - Xóa bài test
router.delete("/:id", deleteTest);

// PATCH  /api/tests/:id/publish - Bật/Tắt trạng thái xuất bản
router.patch("/:id/publish", togglePublishTest);

export default router;


