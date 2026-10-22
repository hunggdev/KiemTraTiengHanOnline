import express from "express";
import {
  assignTestToClass,
  getTestAssignments,
  deleteAssignment,
  getStudentAvailableTests,
} from "../controllers/assignmentController.js";
import { verifyAuth, requireRole } from "../middlewares/authMiddleware.js";

const router = express.Router();

// POST   /api/assignments              - Giao đề thi cho lớp (TEACHER only)
router.post("/", verifyAuth, requireRole("TEACHER"), assignTestToClass);

// GET    /api/assignments/test/:id     - Lấy danh sách giao bài của 1 test (TEACHER only)
router.get("/test/:id", verifyAuth, requireRole("TEACHER"), getTestAssignments);

// DELETE /api/assignments/:assignmentId - Hủy giao bài (TEACHER only)
router.delete("/:assignmentId", verifyAuth, requireRole("TEACHER"), deleteAssignment);

// GET    /api/assignments/available    - Lấy bài thi đang mở cho học sinh (theo lớp)
router.get("/available", verifyAuth, getStudentAvailableTests);

export default router;
