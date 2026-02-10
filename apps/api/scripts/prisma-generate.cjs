/* eslint-disable no-console */

const { spawnSync } = require('node:child_process');

const DEFAULT_DATABASE_URL =
  'postgresql://prisma:prisma@localhost:5432/reetro_booking?schema=public';

function main() {
  const env = { ...process.env };

  if (!env.DATABASE_URL || env.DATABASE_URL.trim() === '') {
    env.DATABASE_URL = DEFAULT_DATABASE_URL;
    console.log('[prisma-generate] DATABASE_URL not set; using a dummy local value for generate');
  }

  const pnpmCmd = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  const result = spawnSync(
    pnpmCmd,
    ['exec', 'prisma', 'generate', '--schema=prisma/schema.prisma'],
    {
      stdio: 'inherit',
      env,
    }
  );

  if (result.error) {
    console.error('[prisma-generate] Failed to run prisma generate:', result.error);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

main();
