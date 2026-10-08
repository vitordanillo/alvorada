const path = require('node:path');
const root = path.resolve(__dirname, '..');
const logs = path.resolve(root, '..', 'logs');
module.exports = { apps: [{
  name: 'alvorada-smart-market',
  cwd: root,
  script: path.join(__dirname, 'start-server.cjs'),
  exec_mode: 'fork', instances: 1, watch: false,
  autorestart: true, max_memory_restart: '600M',
  min_uptime: '10s', max_restarts: 15, exp_backoff_restart_delay: 500,
  kill_timeout: 10000, time: true,
  out_file: path.join(logs, 'stdout.log'),
  error_file: path.join(logs, 'stderr.log'),
}] };
