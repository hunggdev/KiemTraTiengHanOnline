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

    // 1. Lấy userId từ JWT cookie hoặc Authorization header (hoặc fallback từ body nếu mobile chặn cookie)
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

    // Fallback: Khi cookie bị chặn trên trình duyệt điện thoại (iOS Safari / in-app browsers)
    if (!validUserId && req.body.userId) {
      const parsedUserId = parseInt(req.body.userId, 10);
      if (!isNaN(parsedUserId)) {
        const existingUser = await prisma.user.findUnique({
          where: { id: parsedUserId },
          select: { id: true },
        });
        if (existingUser) {
          validUserId = existingUser.id;
        }
      }
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

// 9. Thống kê số liệu chi tiết cho 1 bài test (Dành riêng cho giáo viên - TEACHER)
// Thống kê người tham gia (chỉ lấy bài cao nhất của mỗi học sinh), biểu đồ điểm số, kết quả tổng quan
export const getTestStats = async (req, res) => {
  try {
    const { id } = req.params;
    const testId = parseInt(id, 10);

    if (isNaN(testId)) {
      return res.status(400).json({
        success: false,
        message: "ID bài kiểm tra không hợp lệ",
      });
    }

    // 1. Lấy thông tin bài kiểm tra, các phần thi và câu hỏi
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            questions: {
              select: {
                id: true,
                score: true,
                type: true,
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

    // Tính tổng số câu và tổng điểm tối đa của đề thi
    let totalQuestions = 0;
    let maxScore = 0;
    const sectionStatsConfig = [];

    for (const sec of test.sections) {
      const secQuestionCount = sec.questions.length;
      const secMaxScore = sec.questions.reduce((sum, q) => sum + (Number(q.score) || 1), 0);
      totalQuestions += secQuestionCount;
      maxScore += secMaxScore;

      sectionStatsConfig.push({
        sectionId: sec.id,
        skill: sec.skill,
        order: sec.order,
        questionIds: sec.questions.map((q) => q.id),
        questionCount: secQuestionCount,
        maxScore: secMaxScore,
      });
    }

    maxScore = maxScore > 0 ? Math.round(maxScore * 100) / 100 : 10;

    // 2. Lấy tất cả lượt làm bài đã nộp của bài thi này
    const allAttempts = await prisma.testAttempt.findMany({
      where: {
        testId: testId,
        status: { in: ["SUBMITTED", "GRADED", "EXPIRED"] },
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        responses: {
          select: {
            questionId: true,
            isCorrect: true,
            scoreGiven: true,
          },
        },
      },
      orderBy: [
        { totalScore: "desc" },
        { submittedAt: "desc" },
      ],
    });

    // 3. Lọc người tham gia DISTINCT (mỗi học sinh chỉ lấy bài có điểm cao nhất)
    const userAttemptsMap = new Map();

    for (const att of allAttempts) {
      const uId = att.userId;
      if (!userAttemptsMap.has(uId)) {
        userAttemptsMap.set(uId, {
          user: att.user,
          allAttempts: [],
          bestAttempt: att,
        });
      }
      const entry = userAttemptsMap.get(uId);
      entry.allAttempts.push(att);

      const currentBestScore = Number(entry.bestAttempt.totalScore) || 0;
      const thisScore = Number(att.totalScore) || 0;
      if (thisScore > currentBestScore) {
        entry.bestAttempt = att;
      }
    }

    const totalParticipants = userAttemptsMap.size;
    const totalAttemptsCount = allAttempts.length;

    // 4. Xử lý danh sách thí sinh và bảng xếp hạng
    const participants = [];
    const scoreDistributionBuckets = [
      { key: "poor", range: "0 - 1.9", label: "Kém (< 2.0)", count: 0, percentage: 0, color: "#ef4444" },
      { key: "weak", range: "2.0 - 4.9", label: "Yếu (2.0 - 4.9)", count: 0, percentage: 0, color: "#f97316" },
      { key: "average", range: "5.0 - 6.4", label: "Trung bình (5.0 - 6.4)", count: 0, percentage: 0, color: "#eab308" },
      { key: "good", range: "6.5 - 7.9", label: "Khá (6.5 - 7.9)", count: 0, percentage: 0, color: "#3b82f6" },
      { key: "very_good", range: "8.0 - 8.9", label: "Giỏi (8.0 - 8.9)", count: 0, percentage: 0, color: "#6366f1" },
      { key: "excellent", range: "9.0 - 10.0", label: "Xuất sắc (9.0 - 10.0)", count: 0, percentage: 0, color: "#10b981" },
    ];

    let totalScoreSum = 0;
    let highestScore = 0;
    let lowestScore = maxScore;
    let passCount = 0;
    let excellenceCount = 0;

    // Phục vụ tính điểm theo kỹ năng
    const sectionCorrectCounts = {};
    const sectionTotalAnswers = {};
    for (const sec of sectionStatsConfig) {
      sectionCorrectCounts[sec.sectionId] = 0;
      sectionTotalAnswers[sec.sectionId] = 0;
    }

    for (const [userId, entry] of userAttemptsMap.entries()) {
      const best = entry.bestAttempt;
      const rawScore = Number(best.totalScore) || 0;
      const roundedRawScore = Math.round(rawScore * 100) / 100;
      
      // Quy chuẩn về thang điểm 10 để tính xếp loại chuẩn
      const scoreOn10 = maxScore > 0 ? Math.round((rawScore / maxScore) * 10 * 10) / 10 : 0;
      const percentage = maxScore > 0 ? Math.round((rawScore / maxScore) * 100 * 10) / 10 : 0;
      const isPassed = scoreOn10 >= 5.0;

      totalScoreSum += roundedRawScore;
      if (roundedRawScore > highestScore) highestScore = roundedRawScore;
      if (roundedRawScore < lowestScore) lowestScore = roundedRawScore;
      if (isPassed) passCount++;
      if (scoreOn10 >= 8.0) excellenceCount++;

      // Phân loại vào bucket điểm số
      if (scoreOn10 < 2.0) scoreDistributionBuckets[0].count++;
      else if (scoreOn10 < 5.0) scoreDistributionBuckets[1].count++;
      else if (scoreOn10 < 6.5) scoreDistributionBuckets[2].count++;
      else if (scoreOn10 < 8.0) scoreDistributionBuckets[3].count++;
      else if (scoreOn10 < 9.0) scoreDistributionBuckets[4].count++;
      else scoreDistributionBuckets[5].count++;

      // Tính thống kê theo từng phần thi của bài thi cao nhất
      if (Array.isArray(best.responses)) {
        for (const sec of sectionStatsConfig) {
          const secQIds = new Set(sec.questionIds);
          for (const resp of best.responses) {
            if (secQIds.has(resp.questionId)) {
              sectionTotalAnswers[sec.sectionId]++;
              if (resp.isCorrect || (Number(resp.scoreGiven) || 0) > 0) {
                sectionCorrectCounts[sec.sectionId]++;
              }
            }
          }
        }
      }

      let grade = "Kém";
      if (scoreOn10 >= 9.0) grade = "Xuất sắc";
      else if (scoreOn10 >= 8.0) grade = "Giỏi";
      else if (scoreOn10 >= 6.5) grade = "Khá";
      else if (scoreOn10 >= 5.0) grade = "Trung bình";
      else if (scoreOn10 >= 2.0) grade = "Yếu";

      participants.push({
        userId: entry.user.id,
        fullName: entry.user.fullName,
        username: entry.user.username,
        className: entry.user.class?.name || "Chưa phân lớp",
        highestScore: roundedRawScore,
        scoreOn10,
        percentage,
        isPassed,
        grade,
        attemptsCount: entry.allAttempts.length,
        submittedAt: best.submittedAt,
        attemptId: best.id,
      });
    }

    // Sắp xếp bảng xếp hạng theo điểm cao nhất giảm dần
    participants.sort((a, b) => {
      if (b.highestScore !== a.highestScore) return b.highestScore - a.highestScore;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    // Gán Rank 1, 2, 3...
    participants.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    // Hoàn thiện % cho các distribution buckets
    if (totalParticipants > 0) {
      scoreDistributionBuckets.forEach((bucket) => {
        bucket.percentage = Math.round((bucket.count / totalParticipants) * 100 * 10) / 10;
      });
    } else {
      lowestScore = 0;
    }

    const averageScore = totalParticipants > 0 
      ? Math.round((totalScoreSum / totalParticipants) * 100) / 100 
      : 0;
    const averageScoreOn10 = maxScore > 0 
      ? Math.round((averageScore / maxScore) * 10 * 10) / 10 
      : 0;
    const passRate = totalParticipants > 0 
      ? Math.round((passCount / totalParticipants) * 100 * 10) / 10 
      : 0;
    const excellenceRate = totalParticipants > 0 
      ? Math.round((excellenceCount / totalParticipants) * 100 * 10) / 10 
      : 0;

    // 5. Thống kê theo từng kỹ năng / section
    const skillStats = sectionStatsConfig.map((sec) => {
      const totalAns = sectionTotalAnswers[sec.sectionId] || 0;
      const correctAns = sectionCorrectCounts[sec.sectionId] || 0;
      const accuracyRate = totalAns > 0 ? Math.round((correctAns / totalAns) * 100 * 10) / 10 : 0;

      return {
        sectionId: sec.sectionId,
        skill: sec.skill,
        order: sec.order,
        questionCount: sec.questionCount,
        maxScore: sec.maxScore,
        accuracyRate,
        totalAnswers: totalAns,
        correctAnswers: correctAns,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        test: {
          id: test.id,
          title: test.title,
          description: test.description,
          durationMin: test.durationMin,
          isPublished: test.isPublished,
          createdAt: test.createdAt,
          maxScore,
          totalQuestions,
          sectionsCount: test.sections.length,
        },
        summary: {
          totalParticipants, // Số thí sinh duy nhất
          totalAttemptsCount, // Tổng số lượt nộp bài
          averageScore, // Điểm trung bình (thang điểm gốc)
          averageScoreOn10, // Điểm trung bình (thang điểm 10)
          highestScore, // Điểm cao nhất
          lowestScore, // Điểm thấp nhất
          passCount, // Số lượng đạt
          failCount: totalParticipants - passCount, // Số lượng chưa đạt
          passRate, // Tỷ lệ đạt (%)
          excellenceCount, // Số lượng giỏi/xuất sắc (>= 8.0)
          excellenceRate, // Tỷ lệ giỏi/xuất sắc (%)
        },
        distribution: scoreDistributionBuckets,
        skillStats,
        participants,
      },
    });
  } catch (error) {
    console.error("Get test statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thống kê kết quả bài thi",
      error: error.message,
    });
  }
};

