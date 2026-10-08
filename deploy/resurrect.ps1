$ErrorActionPreference = 'Stop'
$appRoot = Split-Path -Parent $PSScriptRoot
$deploymentRoot = Split-Path -Parent $appRoot
$env:PM2_HOME = Join-Path $deploymentRoot 'pm2'
$node = 'C:\Program Files\nodejs\node.exe'
$pm2Cli = 'C:\Users\Administrator\AppData\Roaming\npm\node_modules\pm2\bin\pm2'
Set-Location -LiteralPath $appRoot
& $node $pm2Cli resurrect
if ($LASTEXITCODE -ne 0) { throw 'Failed to restore Alvorada process.' }
