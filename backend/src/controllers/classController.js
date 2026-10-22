import prisma from "../prisma.js";

// 1. Lấy danh sách tất cả lớp học (kèm số học sinh)
export const getAllClasses = async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { users: true, tests: true },
        },
        users: {
          select: {
            id: true,
            fullName: true,
            username: true,
            canAccessFlashcard: true,
            createdAt: true,
          },
          orderBy: { fullName: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    console.error("Get all classes error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách lớp học",
      error: error.message,
    });
  }
};

// 2. Lấy chi tiết 1 lớp học (kèm danh sách học sinh đầy đủ)
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id, 10);

    if (isNaN(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp không hợp lệ" });
    }

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            username: true,
            canAccessFlashcard: true,
            createdAt: true,
          },
          orderBy: { fullName: "asc" },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
    }

    return res.status(200).json({ success: true, data: classData });
  } catch (error) {
    console.error("Get class by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết lớp học",
      error: error.message,
    });
  }
};

// 3. Tạo lớp học mới
export const createClass = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên lớp học là bắt buộc" });
    }

    // Kiểm tra trùng tên
    const existing = await prisma.class.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Lớp "${name.trim()}" đã tồn tại`,
      });
    }

    const newClass = await prisma.class.create({
      data: { name: name.trim() },
      include: {
        _count: { select: { users: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Đã tạo lớp "${newClass.name}" thành công`,
      data: newClass,
    });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo lớp học",
      error: error.message,
    });
  }
};

// 4. Đổi tên lớp học
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    const { name } = req.body;

    if (isNaN(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp không hợp lệ" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Tên lớp học là bắt buộc" });
    }

    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { name: name.trim() },
      include: { _count: { select: { users: true } } },
    });

    return res.status(200).json({
      success: true,
      message: `Đã đổi tên lớp thành "${updatedClass.name}"`,
      data: updatedClass,
    });
  } catch (error) {
    console.error("Update class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật lớp học",
      error: error.message,
    });
  }
};

// 5. Xóa lớp học (học sinh không bị xóa, chỉ bị bỏ khỏi lớp)
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id, 10);

    if (isNaN(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp không hợp lệ" });
    }

    const existing = await prisma.class.findUnique({ where: { id: classId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
    }

    // Gỡ học sinh khỏi lớp trước (set classId = null)
    await prisma.user.updateMany({
      where: { classId },
      data: { classId: null },
    });

    await prisma.class.delete({ where: { id: classId } });

    return res.status(200).json({
      success: true,
      message: `Đã xóa lớp "${existing.name}"`,
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa lớp học",
      error: error.message,
    });
  }
};

// 6. Thêm học sinh vào lớp (hỗ trợ hàng loạt)
export const addStudentsToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    const { studentIds } = req.body; // number[]

    if (isNaN(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp không hợp lệ" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách studentIds là bắt buộc" });
    }

    const classData = await prisma.class.findUnique({ where: { id: classId } });
    if (!classData) {
      return res.status(404).json({ success: false, message: "Không tìm thấy lớp học" });
    }

    const parsedIds = studentIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    await prisma.user.updateMany({
      where: { id: { in: parsedIds }, role: "STUDENT" },
      data: { classId },
    });

    return res.status(200).json({
      success: true,
      message: `Đã thêm ${parsedIds.length} học sinh vào lớp "${classData.name}"`,
    });
  } catch (error) {
    console.error("Add students to class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thêm học sinh vào lớp",
      error: error.message,
    });
  }
};

// 7. Gỡ học sinh khỏi lớp (hỗ trợ hàng loạt)
export const removeStudentsFromClass = async (req, res) => {
  try {
    const { id } = req.params;
    const classId = parseInt(id, 10);
    const { studentIds } = req.body;

    if (isNaN(classId)) {
      return res.status(400).json({ success: false, message: "ID lớp không hợp lệ" });
    }

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Danh sách studentIds là bắt buộc" });
    }

    const parsedIds = studentIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    await prisma.user.updateMany({
      where: { id: { in: parsedIds }, classId },
      data: { classId: null },
    });

    return res.status(200).json({
      success: true,
      message: `Đã gỡ ${parsedIds.length} học sinh khỏi lớp`,
    });
  } catch (error) {
    console.error("Remove students from class error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi gỡ học sinh khỏi lớp",
      error: error.message,
    });
  }
};
