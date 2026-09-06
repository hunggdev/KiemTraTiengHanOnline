import prisma from './src/prisma.js';

async function main() {
  const tests = await prisma.test.findMany({
    include: {
      sections: {
        include: {
          questions: {
            select: { id: true, type: true, content: true, score: true, correctAnswer: true }
          }
        }
      },
      attempts: {
        include: {
          user: { select: { id: true, fullName: true, username: true } },
          responses: true
        }
      }
    }
  });

  for (const t of tests) {
    console.log("=========================================");
    console.log(`TEST ID: ${t.id} - TITLE: "${t.title}"`);
    console.log(`Duration: ${t.durationMin}min, Sections: ${t.sections.length}`);
    for (const s of t.sections) {
      console.log(`  Section ${s.order} (${s.skill}): ${s.questions.length} questions`);
      for (const q of s.questions) {
        console.log(`    Q${q.id} [${q.type}]: "${q.content}" (score: ${q.score}, correct: "${q.correctAnswer}")`);
      }
    }
    console.log(`  Attempts: ${t.attempts.length}`);
    for (const a of t.attempts) {
      console.log(`    Attempt #${a.id} by "${a.user.fullName}" - Status: ${a.status}, TotalScore: ${a.totalScore}, Responses: ${a.responses.length}`);
      for (const r of a.responses) {
        console.log(`      Resp Q${r.questionId}: answerText="${r.answerText}", isCorrect=${r.isCorrect}, scoreGiven=${r.scoreGiven}`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
