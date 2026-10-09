const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env') });
if (!process.env.DATABASE_URL || !process.env.AUTH_SESSION_SECRET || process.env.AUTH_SESSION_SECRET.length < 32) {
  throw new Error('Database connection and session secret must be configured.');
}
process.env.NODE_ENV = 'production';
process.env.HOSTNAME = process.env.ALVORADA_HOST || '0.0.0.0';
process.env.PORT = process.env.ALVORADA_PORT || '3070';
process.env.ALVORADA_PROOF_DIR ||= path.join(root, 'uploads', 'invoice-proofs');
process.env.ALVORADA_AVATAR_DIR ||= path.join(root, 'uploads', 'avatars');
require(path.join(root, process.env.ALVORADA_BUILD_DIR || '.next', 'standalone', 'server.js'));
