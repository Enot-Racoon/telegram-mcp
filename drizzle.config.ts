import type { Config } from 'drizzle-kit';

export default {
  schema: './src/core/database/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './telegram.db',
  },
} satisfies Config;
