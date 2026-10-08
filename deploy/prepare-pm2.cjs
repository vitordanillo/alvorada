const fs = require('node:fs');
const path = require('node:path');
const appRoot = path.resolve(__dirname, '..');
const source = process.env.ALVORADA_PM2_SOURCE || 'C:\\Users\\Administrator\\AppData\\Roaming\\npm\\node_modules\\pm2';
const destination = path.resolve(appRoot, '..', 'runtime', 'pm2');
const version = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8')).version;
fs.cpSync(source, destination, { recursive: true, dereference: true });
const pathsFile = path.join(destination, 'paths.js');
let code = fs.readFileSync(pathsFile, 'utf8');
for (const [key, suffix] of [['DAEMON_RPC_PORT', 'rpc'], ['DAEMON_PUB_PORT', 'pub'], ['INTERACTOR_RPC_PORT', 'interactor']]) {
  const pattern = new RegExp(`pm2_file_stucture\\.${key} = '[^'\\n]+';`, 'g');
  if ((code.match(pattern) || []).length !== 1) throw new Error('Unsupported PM2 Windows socket configuration.');
  code = code.replace(pattern, `pm2_file_stucture.${key} = ${JSON.stringify('\\\\.\\pipe\\alvorada-smart-market-' + suffix + '.sock')};`);
}
fs.writeFileSync(pathsFile, code);
console.log(`Prepared private PM2 ${version} with dedicated Windows named pipes.`);
