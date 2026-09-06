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
          responses: true
        }
      }
    }
  });

  for (const t of tests) {
    console.log(`\n=== TEST [${t.id}] "${t.title}" ===`);
    const allQ = t.sections.flatMap(s => s.questions);
    console.log(`Total Qs: ${allQ.length}, Types: ${JSON.stringify(allQ.map(q => q.type))}`);
    for (const q of allQ) {
      console.log(`  - Q${q.id} [${q.type}] "${q.content.substring(0, 50)}..." (${q.score}đ)`);
    }
    console.log(`Attempts count: ${t.attempts.length}`);
    for (const a of t.attempts) {
      console.log(`  Attempt ${a.id} by ${a.user.fullName} (${a.user.username}) - status: ${a.status}, totalScore: ${a.totalScore}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
