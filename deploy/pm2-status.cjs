const fs = require('node:fs');
const apps = JSON.parse(fs.readFileSync(0, 'utf8'));
const status = apps.map(app => ({ name: app.name, pid: app.pid, status: app.pm2_env.status, restarts: app.pm2_env.restart_time, memoryMb: Math.round(app.monit.memory / 1024 / 1024) }));
console.log(JSON.stringify(status));
if (apps.length !== 1 || apps[0].name !== 'alvorada-smart-market') process.exitCode = 1;
