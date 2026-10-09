$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory=Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
$sourcePath=Join-Path $PSScriptRoot '../src/assets/granzoti-symbol.png'
Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $assetDirectory 'granzoti-symbol.png') -Force
$source=[Drawing.Image]::FromFile($sourcePath)
$bitmap=New-Object Drawing.Bitmap 256,256
$graphics=[Drawing.Graphics]::FromImage($bitmap)
$graphics.Clear([Drawing.Color]::Transparent)
$graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.DrawImage($source,0,0,256,256)
$stream=New-Object IO.MemoryStream
$bitmap.Save($stream,[Drawing.Imaging.ImageFormat]::Png)
$png=$stream.ToArray()
[IO.File]::WriteAllBytes((Join-Path $assetDirectory 'icon.png'),$png)
$file=[IO.File]::Create((Join-Path $assetDirectory 'icon.ico'))
$writer=New-Object IO.BinaryWriter $file
$writer.Write([uint16]0);$writer.Write([uint16]1);$writer.Write([uint16]1)
$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([byte]0)
$writer.Write([uint16]1);$writer.Write([uint16]32);$writer.Write([uint32]$png.Length);$writer.Write([uint32]22);$writer.Write($png)
$writer.Dispose();$stream.Dispose();$graphics.Dispose();$bitmap.Dispose();$source.Dispose()
Copy-Item -LiteralPath (Join-Path $assetDirectory 'icon.ico') -Destination (Join-Path $PSScriptRoot '../src/app/favicon.ico') -Force
