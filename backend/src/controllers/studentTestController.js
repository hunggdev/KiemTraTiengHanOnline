import prisma from "../prisma.js";

/**
 * 1. Lấy danh sách toàn bộ bài thi đã làm của học sinh đang đăng nhập
 */
export const getMyAttempts = async (req, res) => {
  try {
    const userId = req.user.id;

    const attempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: { in: ["SUBMITTED", "GRADED", "PENDING_GRADING"] },
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            durationMin: true,
            sections: {
              select: {
                skill: true,
                questions: {
                  select: { id: true, score: true, type: true },
                },
              },
            },
          },
        },
        responses: {
          select: {
            id: true,
            isCorrect: true,
            scoreGiven: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });

    // Format dữ liệu kèm tính maxScore của từng bài
    const formattedAttempts = attempts.map((att) => {
      const allQuestions = att.test.sections.flatMap((s) => s.questions);
      const maxScore = allQuestions.reduce((sum, q) => sum + (Number(q.score) || 1), 0);
      const totalQuestions = allQuestions.length;
      const correctQuestions = att.responses.filter((r) => r.isCorrect === true).length;

      return {
        id: att.id,
        testId: att.test.id,
        testTitle: att.test.title,
        durationMin: att.test.durationMin,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        status: att.status,
        totalScore: att.totalScore !== null ? Number(att.totalScore.toFixed(2)) : null,
        maxScore: Number(maxScore.toFixed(2)),
        correctQuestions,
        totalQuestions,
      };
    });

    // Thống kê tổng hợp cá nhân
    const totalAttempts = formattedAttempts.length;
    const gradedAttempts = formattedAttempts.filter((a) => a.totalScore !== null);
    const avgScore =
      gradedAttempts.length > 0
        ? Number(
            (
              gradedAttempts.reduce((sum, a) => sum + (a.totalScore || 0), 0) /
              gradedAttempts.length
            ).toFixed(2)
          )
        : 0;

    const highestScore =
      gradedAttempts.length > 0
        ? Math.max(...gradedAttempts.map((a) => a.totalScore || 0))
        : 0;

    const pendingCount = formattedAttempts.filter(
      (a) => a.status === "PENDING_GRADING" || a.status === "SUBMITTED"
    ).length;

    return res.status(200).json({
      success: true,
      data: {
        attempts: formattedAttempts,
        summary: {
          totalAttempts,
          avgScore,
          highestScore,
          pendingCount,
        },
      },
    });
  } catch (error) {
    console.error("Get my attempts error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy lịch sử bài thi",
      error: error.message,
    });
  }
};

/**
 * 2. Lấy chi tiết bài thi đã nộp của chính học sinh (đáp án, điểm số, phản hồi)
 */
export const getMyAttemptDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { attemptId } = req.params;
    const id = parseInt(attemptId, 10);

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            sections: {
              orderBy: { order: "asc" },
              include: {
                questions: {
                  orderBy: { order: "asc" },
                  include: {
                    options: {
                      orderBy: { label: "asc" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({ success: false, message: "Không tìm thấy bài làm" });
    }

    // Bảo mật: Học sinh chỉ được xem bài làm của chính mình
    if (attempt.userId !== userId && req.user.role !== "TEACHER") {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem bài làm của người khác",
      });
    }

    // Tạo Map responses theo questionId
    const responseMap = new Map();
    attempt.responses.forEach((r) => {
      responseMap.set(r.questionId, r);
    });

    // Tính maxScore
    const allQuestions = attempt.test.sections.flatMap((s) => s.questions);
    const maxScore = allQuestions.reduce((sum, q) => sum + (Number(q.score) || 1), 0);

    const resultSections = attempt.test.sections.map((section) => ({
      id: section.id,
      skill: section.skill,
      order: section.order,
      questions: section.questions.map((q) => {
        const resp = responseMap.get(q.id);
        return {
          id: q.id,
          type: q.type,
          order: q.order,
          content: q.content,
          audioUrl: q.audioUrl,
          imageUrl: q.imageUrl,
          score: q.score,
          correctAnswer: q.correctAnswer,
          options: q.options,
          studentAnswer: resp ? resp.answerText : null,
          studentAudioUrl: resp ? resp.audioUrl : null,
          isCorrect: resp ? resp.isCorrect : false,
          scoreGiven: resp ? resp.scoreGiven : null,
          gradedAt: resp ? resp.gradedAt : null,
        };
      }),
    }));

    return res.status(200).json({
      success: true,
      data: {
        id: attempt.id,
        testId: attempt.test.id,
        testTitle: attempt.test.title,
        durationMin: attempt.test.durationMin,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        status: attempt.status,
        totalScore: attempt.totalScore,
        maxScore,
        sections: resultSections,
      },
    });
  } catch (error) {
    console.error("Get my attempt detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết bài làm",
      error: error.message,
    });
  }
};
