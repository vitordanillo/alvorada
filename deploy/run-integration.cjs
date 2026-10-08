const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const mainUrl = new URL(process.env.DATABASE_URL);
const testUrl = new URL(process.env.TEST_DATABASE_URL || mainUrl.toString());
if (!process.env.TEST_DATABASE_URL) testUrl.searchParams.set('schema', 'alvorada_test');
if (!testUrl.searchParams.get('schema')?.endsWith('_test') || (testUrl.hostname === mainUrl.hostname && testUrl.pathname === mainUrl.pathname && testUrl.searchParams.get('schema') === mainUrl.searchParams.get('schema'))) throw new Error('A distinct disposable test schema is required.');
function run(script, args, env) {
  const result = spawnSync(process.execPath, [path.join(root, script), ...args], { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run('node_modules/prisma/build/index.js', ['migrate', 'deploy'], { ...process.env, DATABASE_URL: testUrl.toString() });
run('node_modules/tsx/dist/cli.mjs', ['scripts/run-tests.ts'], { ...process.env, TEST_DATABASE_URL: testUrl.toString() });
