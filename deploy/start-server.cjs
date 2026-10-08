const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env') });
if (!process.env.DATABASE_URL || !process.env.AUTH_SESSION_SECRET || process.env.AUTH_SESSION_SECRET.length < 32) {
  throw new Error('Database connection and session secret must be configured.');
}
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = process.env.ALVORADA_HOST || '0.0.0.0';
process.env.PORT = process.env.ALVORADA_PORT || '3070';
require(path.join(root, process.env.ALVORADA_BUILD_DIR || '.next', 'standalone', 'server.js'));
