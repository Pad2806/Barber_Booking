/**
 * Deploy script for Zalo Mini App
 *
 * Builds with Vite, then deploys using zmp-cli v4.
 * Temporarily renames root app-config.json so the CLI reads from www/.
 *
 * Usage:
 *   node deploy.cjs              Deploy to Testing (default)
 *   node deploy.cjs --testing    Deploy to Testing
 *   node deploy.cjs --dev        Deploy to Development
 *   node deploy.cjs --desc "..." Set description
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const isTesting = !args.includes('--dev');
const descIdx = args.indexOf('--desc');
const desc = descIdx >= 0 ? args[descIdx + 1] : 'Barber Booking v1';

const rootConfig = path.resolve(__dirname, 'app-config.json');
const rootConfigBak = rootConfig + '.bak';

console.log(`Mode: ${isTesting ? 'Testing' : 'Development'}`);
console.log(`Description: ${desc}\n`);

try {
  // 1. Build
  console.log('Building...');
  execSync('npx vite build', { cwd: __dirname, stdio: 'inherit' });

  // 2. Temporarily rename root app-config.json (CLI reads from www/ instead)
  if (fs.existsSync(rootConfig)) {
    fs.renameSync(rootConfig, rootConfigBak);
  }

  // 3. Deploy
  const flags = [
    isTesting ? '--testing' : '',
    '--existing',
    '--passive',
    `--desc "${desc}"`,
  ].filter(Boolean).join(' ');

  console.log(`\nDeploying with: zmp deploy ${flags}`);
  execSync(`npx zmp deploy ${flags}`, { cwd: __dirname, stdio: 'inherit' });

} catch (err) {
  console.error('Deploy failed:', err.message);
  process.exit(1);
} finally {
  // 4. Restore root app-config.json
  if (fs.existsSync(rootConfigBak)) {
    fs.renameSync(rootConfigBak, rootConfig);
  }
}
