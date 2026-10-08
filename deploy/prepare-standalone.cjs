const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const [source, destination] of [['public', '.next/standalone/public'], ['.next/static', '.next/standalone/.next/static']]) {
  fs.cpSync(path.join(root, source), path.join(root, destination), { recursive: true });
}
console.log('Standalone assets copied.');
