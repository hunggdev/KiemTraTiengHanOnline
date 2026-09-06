import prisma from './src/prisma.js';

// Cập nhật các bài làm có status SUBMITTED của các bài thi có câu hỏi ESSAY
// thành PENDING_GRADING để phân biệt rõ ràng
async function main() {
  // Tìm tất cả bài thi có câu tự luận
  const testsWithEssay = await prisma.test.findMany({
    include: {
      sections: {
        include: {
          questions: {
            where: { type: { in: ['ESSAY', 'AUDIO_RESPONSE'] } },
            select: { id: true, type: true }
          }
        }
      }
    }
  });

  const essayTestIds = testsWithEssay
    .filter(t => t.sections.some(s => s.questions.length > 0))
    .map(t => t.id);

  console.log('Tests with essay questions:', essayTestIds);

  if (essayTestIds.length === 0) {
    console.log('No essay tests found');
    return;
  }

  // Cập nhật status SUBMITTED -> PENDING_GRADING cho các bài làm chưa chấm
  const result = await prisma.testAttempt.updateMany({
    where: {
      testId: { in: essayTestIds },
      status: 'SUBMITTED'
    },
    data: {
      status: 'PENDING_GRADING'
    }
  });

  console.log(`Updated ${result.count} attempts to PENDING_GRADING status`);

  // Kiểm tra lại
  const updated = await prisma.testAttempt.findMany({
    where: { testId: { in: essayTestIds } },
    include: { user: true }
  });
  for (const a of updated) {
    console.log(`  Attempt ${a.id} by ${a.user.fullName}: status = ${a.status}, totalScore = ${a.totalScore}`);
  }
}

main().finally(() => prisma.$disconnect());
