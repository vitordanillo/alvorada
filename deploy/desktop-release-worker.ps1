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
  $expectedRevision=(& git -c "safe.directory=$repository" -C $repository rev-parse "$tag`^{commit}").Trim()
  $actualRevision=(& git -c "safe.directory=$candidate" -C $candidate rev-parse HEAD).Trim()
  if($expectedRevision -ne $actualRevision){throw 'Checkout da release divergente da tag.'}
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
  # Generated release directories only; customer data and web releases are elsewhere.
  Set-Location -LiteralPath $repository
  $generated=@(Get-ChildItem -LiteralPath $buildRoot -Directory | Where-Object {$_.Name -match '^desktop-v\d+\.\d+\.\d+$'} | Sort-Object {[version]$_.Name.Substring(9)} -Descending)
  foreach($old in @($generated | Select-Object -Skip 3)){
    $resolved=[IO.Path]::GetFullPath($old.FullName)
    if(!$resolved.StartsWith([IO.Path]::GetFullPath($buildRoot)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or $resolved -eq $candidate){throw 'Caminho de limpeza inválido.'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
  }
  & git -c "safe.directory=$repository" worktree prune
  $installers=@(Get-ChildItem -LiteralPath $updateRoot -File | Where-Object {$_.Name -match '^Alvorada-(\d+\.\d+\.\d+)-x64\.exe$'} | Sort-Object {[version]([regex]::Match($_.Name,'\d+\.\d+\.\d+').Value)} -Descending)
  foreach($old in @($installers | Select-Object -Skip 5)){
    $resolved=[IO.Path]::GetFullPath($old.FullName)
    if(!$resolved.StartsWith([IO.Path]::GetFullPath($updateRoot)+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase)){throw 'Caminho de instalador inválido.'}
    Remove-Item -LiteralPath $resolved -Force
    if(Test-Path -LiteralPath ($resolved+'.blockmap')){Remove-Item -LiteralPath ($resolved+'.blockmap') -Force}
  }
} catch {
  Add-Content -LiteralPath $log -Value "$(Get-Date -Format o) FAILED $($_.Exception.Message)"
  throw
} finally {
  $mutex.ReleaseMutex();$mutex.Dispose()
}
