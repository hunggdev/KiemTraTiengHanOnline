import prisma from "../prisma.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kiemtra_jwt_secret_key_2026_super_secure";

// 1. Tạo bài test mới (hỗ trợ tạo kèm sections & questions nếu có)
export const createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      durationMin,
      createdBy,
      isPublished = false,
      sections,
    } = req.body;

    // Validate dữ liệu bắt buộc
    if (!title || durationMin === undefined || durationMin === null) {
      return res.status(400).json({
        success: false,
        message: "Title và durationMin (thời gian làm bài) là bắt buộc",
      });
    }

    if (Number(durationMin) <= 0) {
      return res.status(400).json({
        success: false,
        message: "durationMin phải lớn hơn 0",
      });
    }

    let createdTestId = null;

    await prisma.$transaction(async (tx) => {
      // 1. Tạo Test record
      const test = await tx.test.create({
        data: {
          title: title.trim(),
          description: description ? description.trim() : null,
          durationMin: Number(durationMin),
          createdBy: createdBy || "ADMIN",
          isPublished: Boolean(isPublished),
        },
      });

      createdTestId = test.id;

      // 2. Tạo sections, questions, options nếu có
      if (Array.isArray(sections) && sections.length > 0) {
        for (const [secIdx, sec] of sections.entries()) {
          const createdSec = await tx.testSection.create({
            data: {
              testId: test.id,
              skill: sec.skill || "LISTENING",
              order: sec.order !== undefined ? Number(sec.order) : secIdx + 1,
              durationMin: sec.durationMin ? Number(sec.durationMin) : null,
            },
          });

          if (Array.isArray(sec.questions) && sec.questions.length > 0) {
            for (const [qIdx, q] of sec.questions.entries()) {
              await tx.question.create({
                data: {
                  sectionId: createdSec.id,
                  type: q.type || "MULTIPLE_CHOICE",
                  order: q.order !== undefined ? Number(q.order) : qIdx + 1,
                  content: q.content || "",
                  audioUrl: q.audioUrl || null,
                  imageUrl: q.imageUrl || null,
                  correctAnswer: q.correctAnswer || null,
                  score: q.score !== undefined ? Number(q.score) : 1,
                  options:
                    q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) && q.options.length > 0
                      ? {
                          create: q.options.map((opt) => ({
                            label: opt.label || "A",
                            content: opt.content || "",
                          })),
                        }
                      : undefined,
                },
              });
            }
          }
        }
      }
    }, {
      maxWait: 20000,
      timeout: 60000,
    });

    const test = await prisma.test.findUnique({
      where: { id: createdTestId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      message: "Tạo bài test thành công",
      data: test,
    });
  } catch (error) {
    console.error("Create test error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo bài test",
      error: error.message,
    });
  }
};

// 2. Lấy danh sách tất cả các bài test (có phân trang, tìm kiếm và lọc)
export const getAllTests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      isPublished,
      createdBy,
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (pageNumber - 1) * pageSize;

    // Xây dựng điều kiện lọc
    const where = {};

    if (search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished === "true" || isPublished === true;
    }

    if (createdBy) {
      where.createdBy = createdBy;
    }

    // Thực hiện truy vấn song song (lấy data + tổng số bản ghi)
    const [total, tests] = await Promise.all([
      prisma.test.count({ where }),
      prisma.test.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          _count: {
            select: {
              sections: true,
              assignments: true,
              attempts: true,
            },
          },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: tests,
      pagination: {
        total,
        page: pageNumber,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get all tests error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách bài test",
      error: error.message,
    });
  }
};

// 3. Lấy chi tiết 1 bài test theo ID (kèm sections, questions, options)
export const getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
        assignments: {
          include: {
            class: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài test",
      });
    }

    return res.status(200).json({
      success: true,
      data: test,
    });
  } catch (error) {
    console.error("Get test by id error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết bài test",
      error: error.message,
    });
  }
};

// 4. Cập nhật thông tin bài test
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);
    const { title, description, durationMin, isPublished, sections } = req.body;

    // Kiểm tra test có tồn tại không
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài test cần cập nhật",
      });
    }

    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (durationMin !== undefined) {
      if (Number(durationMin) <= 0) {
        return res.status(400).json({
          success: false,
          message: "durationMin phải lớn hơn 0",
        });
      }
      updateData.durationMin = Number(durationMin);
    }
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    if (Array.isArray(sections)) {
      await prisma.$transaction(async (tx) => {
        // 1. Cập nhật thông tin cơ bản
        await tx.test.update({
          where: { id: testId },
          data: updateData,
        });

        // 2. Xóa các sections cũ (cascade sẽ xóa questions, options, và responses liên quan)
        await tx.testSection.deleteMany({
          where: { testId: testId },
        });

        // 3. Tạo lại sections, questions và options
        for (const [secIdx, sec] of sections.entries()) {
          const createdSec = await tx.testSection.create({
            data: {
              testId: testId,
              skill: sec.skill || "LISTENING",
              order: sec.order !== undefined ? Number(sec.order) : secIdx + 1,
              durationMin: sec.durationMin ? Number(sec.durationMin) : null,
            },
          });

          if (Array.isArray(sec.questions) && sec.questions.length > 0) {
            for (const [qIdx, q] of sec.questions.entries()) {
              await tx.question.create({
                data: {
                  sectionId: createdSec.id,
                  type: q.type || "MULTIPLE_CHOICE",
                  order: q.order !== undefined ? Number(q.order) : qIdx + 1,
                  content: q.content || "",
                  audioUrl: q.audioUrl || null,
                  imageUrl: q.imageUrl || null,
                  correctAnswer: q.correctAnswer || null,
                  score: q.score !== undefined ? Number(q.score) : 1,
                  options:
                    q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) && q.options.length > 0
                      ? {
                          create: q.options.map((opt) => ({
                            label: opt.label || "A",
                            content: opt.content || "",
                          })),
                        }
                      : undefined,
                },
              });
            }
          }
        }
      }, {
        maxWait: 20000,
        timeout: 60000,
      });
    } else {
      await prisma.test.update({
        where: { id: testId },
        data: updateData,
      });
    }

    // Lấy lại dữ liệu bài test hoàn chỉnh sau khi cập nhật
    const updatedTest = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cập nhật bài test thành công",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Update test error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi cập nhật bài test",
      error: error.message,
    });
  }
};

// 5. Xóa bài test theo ID
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    // Kiểm tra test có tồn tại không
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài test cần xóa",
      });
    }

    await prisma.test.delete({
      where: { id: testId },
    });

    return res.status(200).json({
      success: true,
      message: "Xóa bài test thành công",
    });
  } catch (error) {
    console.error("Delete test error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa bài test",
      error: error.message,
    });
  }
};

// 6. Bật / Tắt trạng thái xuất bản (publish/unpublish) bài test
export const togglePublishTest = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!existingTest) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài test",
      });
    }

    const updatedTest = await prisma.test.update({
      where: { id: testId },
      data: {
        isPublished: !existingTest.isPublished,
      },
    });

    return res.status(200).json({
      success: true,
      message: updatedTest.isPublished
        ? "Đã xuất bản bài test"
        : "Đã hủy xuất bản bài test",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Toggle publish test error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thay đổi trạng thái xuất bản bài test",
      error: error.message,
    });
  }
};

// 7. Lấy bài thi cho học sinh làm (isPublished = true, ẩn đáp án đúng)
export const getTestForTaking = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              orderBy: { order: "asc" },
              include: {
                options: {
                  select: {
                    id: true,
                    label: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!test || !test.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Bài kiểm tra không tồn tại hoặc chưa được xuất bản",
      });
    }

    // Ẩn correctAnswer khi học sinh đang làm bài để đảm bảo tính minh bạch
    const sanitizedSections = test.sections.map((sec) => ({
      ...sec,
      questions: sec.questions.map((q) => {
        const { correctAnswer, ...rest } = q;
        return rest;
      }),
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...test,
        sections: sanitizedSections,
      },
    });
  } catch (error) {
    console.error("Get test for taking error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy đề thi",
      error: error.message,
    });
  }
};

// 8. Nộp bài kiểm tra, auto-grade trắc nghiệm và lưu kết quả vào DB
export const submitTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);
    const { answers = [] } = req.body; // answers: [{ questionId, answerText }]

    // 1. Lấy userId từ JWT cookie (bắt buộc phải đăng nhập)
    let validUserId = null;
    try {
      let token = req.cookies?.token;
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        validUserId = decoded.id; // Int từ DB
      }
    } catch (_) {
      // token không hợp lệ hoặc hết hạn
    }

    if (!validUserId) {
      return res.status(401).json({
        success: false,
        message: "Bạn cần đăng nhập để nộp bài kiểm tra",
      });
    }

    // 2. Kiểm tra test
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài kiểm tra",
      });
    }

    // 3. Gom toàn bộ câu hỏi và chấm điểm
    const allQuestions = test.sections.flatMap((s) => s.questions);
    const answersMap = new Map();
    for (const ans of answers) {
      // questionId từ frontend có thể là string hoặc number → parse sang Int để match với DB
      const qid = typeof ans.questionId === "string" ? parseInt(ans.questionId, 10) : ans.questionId;
      answersMap.set(qid, ans.answerText);
    }

    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;

    const responsesToCreate = [];
    const questionReview = [];

    for (const q of allQuestions) {
      const qScore = q.score || 1;
      maxScore += qScore;

      const userAnswer = answersMap.get(q.id) || null;
      let isCorrect = false;
      let scoreGiven = 0;

      if (q.type === "MULTIPLE_CHOICE") {
        if (
          userAnswer &&
          q.correctAnswer &&
          userAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase()
        ) {
          isCorrect = true;
          scoreGiven = qScore;
          correctCount++;
          totalScore += qScore;
        }
      } else {
        isCorrect = null;
        scoreGiven = null;
      }

      responsesToCreate.push({
        questionId: q.id,
        answerText: userAnswer,
        isCorrect,
        scoreGiven,
      });

      questionReview.push({
        questionId: q.id,
        content: q.content,
        type: q.type,
        score: qScore,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        scoreGiven,
        options: q.options,
      });
    }

    // Round để tránh lỗi số thực dấu phẩy động (vd: 9.99999999999999)
    totalScore = Math.round(totalScore * 100) / 100;
    maxScore = Math.round(maxScore * 100) / 100;

    // 4. Lưu TestAttempt và các Response vào cơ sở dữ liệu
    const attempt = await prisma.testAttempt.create({
      data: {
        userId: validUserId,
        testId: test.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
        totalScore,
        responses: {
          create: responsesToCreate,
        },
      },
      include: {
        responses: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Nộp bài kiểm tra thành công",
      data: {
        attemptId: attempt.id,
        testId: test.id,
        testTitle: test.title,
        totalScore,
        maxScore,
        percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        correctCount,
        totalQuestions: allQuestions.length,
        submittedAt: attempt.submittedAt,
        questionReview,
      },
    });
  } catch (error) {
    console.error("Submit test attempt error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi nộp bài kiểm tra",
      error: error.message,
    });
  }
};
