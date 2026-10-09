const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const buildDir=process.env.ALVORADA_BUILD_DIR || '.next';
for (const [source, destination] of [['public', `${buildDir}/standalone/public`], [`${buildDir}/static`, `${buildDir}/standalone/${buildDir}/static`]]) {
  fs.cpSync(path.join(root, source), path.join(root, destination), { recursive: true });
}
console.log('Standalone assets copied.');
const worker=path.join(root,buildDir,'standalone/public/sw.js');
if(fs.existsSync(worker))fs.writeFileSync(worker,fs.readFileSync(worker,'utf8').replace('__ALVORADA_BUILD__',fs.readFileSync(path.join(root,buildDir,'BUILD_ID'),'utf8').trim()));
const staticRoot=path.join(root,buildDir,'static');
const assets=fs.readdirSync(staticRoot,{recursive:true}).filter(name=>/\.(js|css|woff2?|png|svg|jpg)$/.test(name)).map(name=>'/_next/static/'+name.replaceAll('\\','/'));
fs.writeFileSync(path.join(root,buildDir,'standalone/public/offline-assets.json'),JSON.stringify(assets));
