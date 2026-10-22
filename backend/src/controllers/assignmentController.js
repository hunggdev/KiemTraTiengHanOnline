import prisma from "../prisma.js";

// 1. Giao đề thi cho lớp học
export const assignTestToClass = async (req, res) => {
  try {
    const { testId, classId, openAt, closeAt } = req.body;

    if (!testId || !classId || !openAt || !closeAt) {
      return res.status(400).json({
        success: false,
        message: "testId, classId, openAt và closeAt là bắt buộc",
      });
    }

    const openDate = new Date(openAt);
    const closeDate = new Date(closeAt);

    if (isNaN(openDate.getTime()) || isNaN(closeDate.getTime())) {
      return res.status(400).json({ success: false, message: "Ngày giờ không hợp lệ" });
    }

    if (closeDate <= openDate) {
      return res.status(400).json({
        success: false,
        message: "Thời gian đóng bài phải sau thời gian mở bài",
      });
    }

    // Kiểm tra test tồn tại
    const test = await prisma.test.findUnique({ where: { id: parseInt(testId, 10) } });
    if (!test) return res.status(404).json({ success: false, message: "Không tìm thấy bài test" });

    // Kiểm tra lớp tồn tại
    const cls = await prisma.class.findUnique({ where: { id: parseInt(classId, 10) } });
    if (!cls) return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });

    // Kiểm tra đã giao cho lớp này chưa
    const existing = await prisma.testAssignment.findFirst({
      where: {
        testId: parseInt(testId, 10),
        classId: parseInt(classId, 10),
      },
    });

    if (existing) {
      // Cập nhật thời gian nếu đã giao
      const updated = await prisma.testAssignment.update({
        where: { id: existing.id },
        data: { openAt: openDate, closeAt: closeDate },
        include: {
          class: { select: { id: true, name: true } },
          test: { select: { id: true, title: true } },
        },
      });

      return res.status(200).json({
        success: true,
        message: `Đã cập nhật thời gian giao bài cho lớp "${cls.name}"`,
        data: updated,
      });
    }

    // Tạo mới assignment
    const assignment = await prisma.testAssignment.create({
      data: {
        testId: parseInt(testId, 10),
        classId: parseInt(classId, 10),
        openAt: openDate,
        closeAt: closeDate,
      },
      include: {
        class: { select: { id: true, name: true } },
        test: { select: { id: true, title: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Đã giao bài "${test.title}" cho lớp "${cls.name}"`,
      data: assignment,
    });
  } catch (error) {
    console.error("Assign test to class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi giao bài thi",
      error: error.message,
    });
  }
};

// 2. Lấy danh sách assignment của 1 bài test
export const getTestAssignments = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    const assignments = await prisma.testAssignment.findMany({
      where: { testId },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            _count: { select: { users: true } },
          },
        },
      },
      orderBy: { openAt: "asc" },
    });

    return res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    console.error("Get test assignments error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách giao bài",
      error: error.message,
    });
  }
};

// 3. Xóa 1 assignment
export const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const id = parseInt(assignmentId, 10);

    const existing = await prisma.testAssignment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy assignment" });
    }

    await prisma.testAssignment.delete({ where: { id } });

    return res.status(200).json({ success: true, message: "Đã hủy giao bài thành công" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi hủy giao bài",
      error: error.message,
    });
  }
};

// 4. Lấy các bài thi đang mở cho học sinh (dựa theo lớp + thời gian)
export const getStudentAvailableTests = async (req, res) => {
  try {
    const classId = req.user?.classId || (req.query.classId ? parseInt(req.query.classId, 10) : null);
    const now = new Date();

    // 1. Nếu học sinh thuộc lớp, tìm các bài test được giao cho lớp này và đang trong thời gian mở
    let classAssignedTestIds = [];
    if (classId) {
      const activeAssignments = await prisma.testAssignment.findMany({
        where: {
          classId: classId,
          openAt: { lte: now },
          closeAt: { gte: now },
        },
        select: { testId: true },
      });
      classAssignedTestIds = activeAssignments.map((a) => a.testId);
    }

    // 2. Tìm tất cả các bài thi:
    // - Hoặc được giao cho lớp của học sinh (đang mở)
    // - Hoặc không bị gán vào bất kỳ lớp nào (bài thi công khai chung)
    const tests = await prisma.test.findMany({
      where: {
        isPublished: true,
        OR: [
          ...(classAssignedTestIds.length > 0 ? [{ id: { in: classAssignedTestIds } }] : []),
          { assignments: { none: {} } }, // Đề thi công khai cho tất cả mọi người
        ],
      },
      include: {
        _count: {
          select: { sections: true, attempts: true },
        },
        assignments: {
          where: classId ? { classId: classId } : {},
          select: {
            id: true,
            openAt: true,
            closeAt: true,
            class: { select: { id: true, name: true } },
          },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: tests });
  } catch (error) {
    console.error("Get student available tests error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bài thi",
      error: error.message,
    });
  }
};
