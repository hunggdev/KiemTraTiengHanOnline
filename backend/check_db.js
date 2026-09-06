import prisma from './src/prisma.js';

async function main() {
  const tests = await prisma.test.findMany({
    include: {
      sections: {
        include: {
          questions: {
            select: { id: true, type: true, content: true, score: true }
          }
        }
      },
      attempts: {
        include: {
          user: { select: { id: true, fullName: true, username: true } },
          responses: {
            include: {
              question: {
                select: { id: true, type: true, content: true, score: true }
              }
            }
          }
        }
      }
    }
  });

  console.log(JSON.stringify(tests.map(t => ({
    id: t.id,
    title: t.title,
    questionCount: t.sections.flatMap(s => s.questions).length,
    questionTypes: [...new Set(t.sections.flatMap(s => s.questions).map(q => q.type))],
    attemptsCount: t.attempts.length,
    attempts: t.attempts.map(a => ({
      id: a.id,
      user: a.user.fullName,
      status: a.status,
      totalScore: a.totalScore,
      responsesCount: a.responses.length,
      responsesSummary: a.responses.map(r => ({
        qId: r.questionId,
        type: r.question?.type,
        answerText: r.answerText,
        isCorrect: r.isCorrect,
        scoreGiven: r.scoreGiven
      }))
    }))
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
