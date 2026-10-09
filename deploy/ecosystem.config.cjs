const path = require('node:path');
const root = path.resolve(__dirname, '..');
const logs = path.resolve(root, '..', 'logs');
module.exports = { apps: [{
  name: 'alvorada-smart-market',
  cwd: root,
  script: path.join(__dirname, 'start-server.cjs'),
  // PM2 retains resolved paths when restarting an existing process.
  // Set them explicitly when promoting a release in a different directory.
  pm_cwd: root, pm_exec_path: path.join(__dirname, 'start-server.cjs'),
  exec_mode: 'fork', instances: 1, watch: false,
  autorestart: true, max_memory_restart: '600M',
  min_uptime: '10s', max_restarts: 15, exp_backoff_restart_delay: 500,
  kill_timeout: 10000, time: true,
  out_file: path.join(logs, 'stdout.log'),
  error_file: path.join(logs, 'stderr.log'),
}, {
  name:'alvorada-billing', cwd:root, script:path.join(__dirname,'billing-worker.cjs'),
  pm_cwd:root, pm_exec_path:path.join(__dirname,'billing-worker.cjs'),
  exec_mode:'fork', instances:1, watch:false, autorestart:true,
  min_uptime:'10s', max_restarts:15, exp_backoff_restart_delay:1000,
  out_file:path.join(logs,'billing-stdout.log'),error_file:path.join(logs,'billing-stderr.log'),time:true,
}] };
