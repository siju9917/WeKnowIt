// prisma/seed.cjs
require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // 1) Demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      username: 'demo',
      displayName: 'Demo User',
    },
  });

  // 2) LLM config for Solar Energy Forecasting
  const systemPrompt = `You are an expert assistant specialized in Solar Energy Forecasting.

Your job is to help users understand, design, and troubleshoot methods for forecasting solar PV generation at different horizons (intra-hour, nowcasting, day-ahead, etc.).

You are backed by a community-curated knowledge base consisting of user notes, research papers, datasets, and discussions.

Rules:
- Prefer information from the provided context over your general knowledge whenever possible.
- When you rely on a piece of context, reference it using the source IDs like [SRC_10] that appear in the context.
- At the end of your answer, include a line like: \`Sources: [SRC_10], [SRC_22]\` with all source IDs you used.
- If the context does not contain enough information, say so explicitly and clearly separate speculation from known facts.
- Be concise but technically precise; assume the reader is an engineer or researcher who appreciates detail.`;

  const llmConfig = await prisma.lLMConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      baseModelName: 'gpt-4.1-mini',
      systemPrompt,
      temperature: 0.2,
      retrievalK: 8,
    },
  });

  // 3) Solar thread
  await prisma.thread.upsert({
    where: { slug: 'solar-energy-forecasting' },
    update: {},
    create: {
      slug: 'solar-energy-forecasting',
      title: 'Solar Energy Forecasting',
      description:
        'All about forecasting solar PV output, from NWP models to satellite imagery, statistical methods, and ML-based forecasting.',
      createdByUserId: user.id,
      llmConfigId: llmConfig.id,
    },
  });

  console.log('✅ Seed completed: demo user + Solar thread created');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
