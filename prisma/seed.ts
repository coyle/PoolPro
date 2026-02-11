import { PrismaClient, Confidence, PlanSource, SanitizerType, SurfaceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@poolpro.local' },
    update: {},
    create: { email: 'demo@poolpro.local', passwordHash: 'demo-hash', name: 'Demo User' },
  });
  const customer = await prisma.customer.create({ data: { userId: user.id, name: 'Jane Homeowner', notes: 'Prefers evening service' } });
  const pool = await prisma.pool.create({
    data: { customerId: customer.id, name: 'Backyard Pool', volumeGallons: 15000, surfaceType: SurfaceType.plaster, sanitizerType: SanitizerType.chlorine, isSalt: false },
  });
  const test = await prisma.waterTest.create({ data: { poolId: pool.id, testedAt: new Date(), fc: 1, cc: 0.6, ph: 7.9, ta: 90, ch: 220, cya: 25, symptoms: 'cloudy water' } });
  await prisma.treatmentPlan.create({
    data: {
      poolId: pool.id,
      waterTestId: test.id,
      source: PlanSource.llm,
      diagnosis: 'Likely low sanitizer and organics causing cloudiness.',
      confidence: Confidence.MEDIUM,
      steps: ['Add chlorine in split doses', 'Brush and run filter continuously for 24h'],
      chemicalAdditions: [{ chemical: 'liquid chlorine 10%', amount: '64', unit: 'oz', instructions: 'Add half now and half after retest if needed.' }],
      safetyNotes: ['Wear PPE', 'Do not mix chemicals'],
      retestInHours: 4,
      whenToCallPro: ['If cloudiness worsens after 24h or equipment pressure spikes'],
      conversationSummary: 'Cloudy water with chlorine smell; conservative oxidizing plan generated.',
    },
  });
}

main().finally(() => prisma.$disconnect());
