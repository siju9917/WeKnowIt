// prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',          // where your schema is
  migrations: {
    path: './prisma/migrations',             // default migrations folder
    seed: 'node ./prisma/seed.cjs',  
  },
  datasource: {
    url: env('DATABASE_URL'),                // read from your .env
  },
});
