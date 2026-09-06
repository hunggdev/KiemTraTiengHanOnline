import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "kiemtra_jwt_secret_key_2026_super_secure";
const JWT_EXPIRES_IN = "7d";

// 1. Đăng ký tài khoản (Mặc định role: STUDENT)
export const signUp = async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      classId,
    } = req.body;

    // 1. Kiểm tra dữ liệu bắt buộc
    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Họ tên, tên đăng nhập và mật khẩu là bắt buộc",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 2. Kiểm tra username đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: {
        username: cleanUsername,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Tên đăng nhập đã tồn tại, vui lòng chọn tên khác",
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Tạo user (mặc định luôn là role STUDENT)
    const user = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash: hashedPassword,
        fullName: fullName.trim(),
        role: "STUDENT", // Mặc định role STUDENT cho người dùng đăng ký
        classId: classId ?? null,
        canAccessFlashcard: false,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        classId: true,
        canAccessFlashcard: true,
        createdAt: true,
      },
    });

    // 5. Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 6. Gửi cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      token,
      data: user,
    });
  } catch (error) {
    console.error("Sign up error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng ký",
      error: error.message,
    });
  }
};

// 2. Đăng nhập (Sign In)
export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập tên đăng nhập và mật khẩu",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Tìm user
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    // 2. So sánh mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Tên đăng nhập hoặc mật khẩu không chính xác",
      });
    }

    // 3. Tạo JWT Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Set Cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const userData = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      classId: user.classId,
      canAccessFlashcard: user.role === "TEACHER" ? true : Boolean(user.canAccessFlashcard),
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      data: userData,
    });
  } catch (error) {
    console.error("Sign in error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng nhập",
      error: error.message,
    });
  }
};

// 3. Đăng xuất (Sign Out)
export const signOut = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    console.error("Sign out error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi đăng xuất",
      error: error.message,
    });
  }
};

// 4. Lấy thông tin user hiện tại (Get Current User / Auth Status)
export const getMe = async (req, res) => {
  try {
    // Đọc token từ cookie hoặc header Authorization
    let token = req.cookies?.token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Chưa đăng nhập",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        classId: true,
        canAccessFlashcard: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }

    const formattedUser = {
      ...user,
      canAccessFlashcard: user.role === "TEACHER" ? true : Boolean(user.canAccessFlashcard),
    };

    return res.status(200).json({
      success: true,
      data: formattedUser,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ",
    });
  }
};

// 5. Lấy danh sách học sinh kèm trạng thái cấp quyền Flashcard (Dành cho TEACHER)
export const getStudentsList = async (req, res) => {
  try {
    const { search, classId } = req.query;

    const whereClause = {
      role: "STUDENT",
    };

    if (classId) {
      whereClause.classId = parseInt(classId, 10);
    }

    if (search && search.trim() !== "") {
      whereClause.OR = [
        { fullName: { contains: search.trim(), mode: "insensitive" } },
        { username: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const students = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        classId: true,
        canAccessFlashcard: true,
        createdAt: true,
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Get students list error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách học sinh",
      error: error.message,
    });
  }
};

// 6. Cấp hoặc thu hồi quyền Flashcard cho 1 học sinh (Dành cho TEACHER)
export const updateFlashcardPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = parseInt(id, 10);
    const { canAccessFlashcard } = req.body;

    if (isNaN(studentId)) {
      return res.status(400).json({
        success: false,
        message: "ID học sinh không hợp lệ",
      });
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: {
        canAccessFlashcard: Boolean(canAccessFlashcard),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        canAccessFlashcard: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Đã ${canAccessFlashcard ? "cấp quyền" : "thu hồi quyền"} Flashcard cho học sinh ${updatedStudent.fullName}`,
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update flashcard permission error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật quyền Flashcard",
      error: error.message,
    });
  }
};

// 7. Cấp hoặc thu hồi quyền Flashcard hàng loạt (Dành cho TEACHER)
export const batchUpdateFlashcardPermissions = async (req, res) => {
  try {
    const { studentIds, canAccessFlashcard } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách studentIds là bắt buộc",
      });
    }

    const parsedIds = studentIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

    await prisma.user.updateMany({
      where: {
        id: { in: parsedIds },
        role: "STUDENT",
      },
      data: {
        canAccessFlashcard: Boolean(canAccessFlashcard),
      },
    });

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật quyền Flashcard thành công cho ${parsedIds.length} học sinh!`,
    });
  } catch (error) {
    console.error("Batch update flashcard permissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật quyền Flashcard hàng loạt",
      error: error.message,
    });
  }
};
