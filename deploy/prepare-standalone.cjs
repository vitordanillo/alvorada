const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const buildDir=process.env.ALVORADA_BUILD_DIR || '.next';
for (const [source, destination] of [['public', `${buildDir}/standalone/public`], [`${buildDir}/static`, `${buildDir}/standalone/${buildDir}/static`]]) {
  fs.cpSync(path.join(root, source), path.join(root, destination), { recursive: true });
}
console.log('Standalone assets copied.');
