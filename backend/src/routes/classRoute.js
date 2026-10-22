import express from "express";
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  addStudentsToClass,
  removeStudentsFromClass,
} from "../controllers/classController.js";
import { verifyAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes dưới đây đều yêu cầu TEACHER

// GET    /api/classes          - Lấy danh sách tất cả lớp học (kèm số học sinh)
router.get("/", verifyAuth, requireRole("TEACHER"), getAllClasses);

// POST   /api/classes          - Tạo lớp học mới
router.post("/", verifyAuth, requireRole("TEACHER"), createClass);

// GET    /api/classes/:id      - Chi tiết lớp học
router.get("/:id", verifyAuth, requireRole("TEACHER"), getClassById);

// PUT    /api/classes/:id      - Đổi tên lớp
router.put("/:id", verifyAuth, requireRole("TEACHER"), updateClass);

// DELETE /api/classes/:id      - Xóa lớp học (học sinh không bị xóa, chỉ bị bỏ khỏi lớp)
router.delete("/:id", verifyAuth, requireRole("TEACHER"), deleteClass);

// POST   /api/classes/:id/students      - Thêm học sinh vào lớp (hàng loạt)
router.post("/:id/students", verifyAuth, requireRole("TEACHER"), addStudentsToClass);

// DELETE /api/classes/:id/students      - Gỡ học sinh khỏi lớp (hàng loạt)
router.delete("/:id/students", verifyAuth, requireRole("TEACHER"), removeStudentsFromClass);

export default router;
