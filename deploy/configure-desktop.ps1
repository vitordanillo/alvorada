$ErrorActionPreference='Stop'
$deploymentRoot='C:\Sites\AlvoradaSmartMarket'
$caddyDirectory='C:\Users\Administrator\Desktop\inclusivaedu'
$config=Join-Path $caddyDirectory 'Caddyfile'
$caddy=Join-Path $caddyDirectory 'caddy_new.exe'
$updates=Join-Path $deploymentRoot 'desktop-updates'
New-Item -ItemType Directory -Path $updates -Force | Out-Null
$existing=[IO.File]::ReadAllText($config)
$originalBlock='(?ms)^alvorada\.firmaconecta\.com\s*\{\s*reverse_proxy 127\.0\.0\.1:3070\s*\}'
$block=@'
alvorada.firmaconecta.com {
    handle_path /desktop-updates/* {
        @release path_regexp release ^/(latest\.(yml|json)|Alvorada-Setup\.exe|Alvorada-[0-9]+\.[0-9]+\.[0-9]+-x64\.exe(\.blockmap)?)$
        handle @release {
            root * C:/Sites/AlvoradaSmartMarket/desktop-updates
            header Cache-Control "no-store"
            file_server
        }
        respond "Not found" 404
    }
    handle {
        reverse_proxy 127.0.0.1:3070
    }
}
'@
if($existing -notmatch 'handle_path /desktop-updates/\*'){
    if([regex]::Matches($existing,$originalBlock).Count -ne 1){throw 'Configuração do domínio divergente; nenhuma alteração aplicada.'}
    $backup=Join-Path $deploymentRoot "backups\Caddyfile-before-desktop-$(Get-Date -Format yyyyMMddHHmmss)"
    Copy-Item -LiteralPath $config -Destination $backup
    $candidate=Join-Path $caddyDirectory 'Caddyfile.desktop-candidate'
    [IO.File]::WriteAllText($candidate,[regex]::Replace($existing,$originalBlock,$block),[Text.UTF8Encoding]::new($false))
    & $caddy validate --config $candidate --adapter caddyfile
    if($LASTEXITCODE -ne 0){throw 'Configuração candidata do Caddy inválida.'}
    Copy-Item -LiteralPath $candidate -Destination $config -Force
    & $caddy reload --config $config --adapter caddyfile
    if($LASTEXITCODE -ne 0){Copy-Item -LiteralPath $backup -Destination $config -Force; & $caddy reload --config $config --adapter caddyfile; throw 'Não foi possível ativar o canal de atualizações.'}
}
$worker=Join-Path $deploymentRoot 'desktop-release-worker.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'desktop-release-worker.ps1') -Destination $worker -Force
$action=New-ScheduledTaskAction -Execute 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$worker`"" -WorkingDirectory $deploymentRoot
$trigger=New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Minutes 30)
$settings=New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 1)
$principal=New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName 'Alvorada-Desktop-Releases' -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force | Select-Object TaskName,State
