import prisma from './src/prisma.js';

async function main() {
  const attempts = await prisma.testAttempt.findMany({
    where: { testId: 7 },
    include: {
      user: true,
      responses: {
        include: {
          question: true
        }
      }
    }
  });

  console.log("=== TEST 7 ATTEMPTS ===");
  for (const a of attempts) {
    console.log(`\nAttempt ID: ${a.id}, User: ${a.user.fullName} (${a.user.username}), Status: ${a.status}, totalScore: ${a.totalScore}`);
    console.log(`Responses count: ${a.responses.length}`);
    for (const r of a.responses) {
      console.log(`  Resp ${r.id}: Q${r.questionId} (${r.question?.type}) answerText="${r.answerText}" scoreGiven=${r.scoreGiven} isCorrect=${r.isCorrect} gradedBy=${r.gradedBy}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
