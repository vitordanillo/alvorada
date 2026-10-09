$ErrorActionPreference='Stop'
$deploymentRoot='C:\Sites\AlvoradaSmartMarket'
$repository=Join-Path $deploymentRoot 'app-offline-20261009'
$updateRoot=Join-Path $deploymentRoot 'desktop-updates'
$buildRoot=Join-Path $deploymentRoot 'desktop-builds'
$log=Join-Path $deploymentRoot 'backups\desktop-release-worker.log'
$mutex=New-Object Threading.Mutex($false,'Global\FirmaConecta-Alvorada-DesktopRelease')
if(!$mutex.WaitOne(0)){exit 0}
try {
  Set-Location -LiteralPath $repository
  & git -c "safe.directory=$repository" fetch origin 'refs/tags/desktop-v*:refs/tags/desktop-v*'
  if($LASTEXITCODE -ne 0){throw 'Não foi possível consultar as releases desktop.'}
  $tags=@(& git -c "safe.directory=$repository" tag --list 'desktop-v*' | Where-Object {$_ -match '^desktop-v\d+\.\d+\.\d+$'} | Sort-Object {[version]$_.Substring(9)})
  if($tags.Count -eq 0){exit 0}
  $tag=$tags[-1]
  $version=$tag.Substring(9)
  $latest=Join-Path $updateRoot 'latest.json'
  if(Test-Path -LiteralPath $latest){$published=Get-Content -Raw -LiteralPath $latest | ConvertFrom-Json;if([version]$published.version -ge [version]$version){exit 0}}
  New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
  $candidate=Join-Path $buildRoot $tag
  if(!(Test-Path -LiteralPath $candidate)){
    & git -c "safe.directory=$repository" worktree add --detach $candidate $tag
    if($LASTEXITCODE -ne 0){throw 'Não foi possível preparar a release.'}
  }
  $desktop=Join-Path $candidate 'desktop'
  if((Get-Content -Raw (Join-Path $desktop 'package.json') | ConvertFrom-Json).version -ne $version){throw 'Tag e versão do aplicativo divergem.'}
  Set-Location -LiteralPath $desktop
  & 'C:\Program Files\nodejs\npm.cmd' ci --no-audit --no-fund
  if($LASTEXITCODE -ne 0){throw 'Falha ao instalar dependências da release.'}
  & 'C:\Program Files\nodejs\npm.cmd' run prepare:assets
  if($LASTEXITCODE -ne 0){throw 'Falha ao incluir a interface na release.'}
  & 'C:\Program Files\nodejs\npm.cmd' run dist
  if($LASTEXITCODE -ne 0){throw 'Falha ao gerar o instalador.'}
  & 'C:\Program Files\nodejs\node.exe' publish.cjs $updateRoot
  if($LASTEXITCODE -ne 0){throw 'Falha ao publicar a atualização.'}
  Add-Content -LiteralPath $log -Value "$(Get-Date -Format o) PUBLISHED $tag"
} catch {
  Add-Content -LiteralPath $log -Value "$(Get-Date -Format o) FAILED $($_.Exception.Message)"
  throw
} finally {
  $mutex.ReleaseMutex();$mutex.Dispose()
}
