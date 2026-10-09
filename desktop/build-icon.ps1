$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$assetDirectory=Join-Path $PSScriptRoot 'assets'
New-Item -ItemType Directory -Path $assetDirectory -Force | Out-Null
$bitmap=New-Object Drawing.Bitmap 256,256
$graphics=[Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode=[Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.Clear([Drawing.Color]::FromArgb(24,42,70))
$brush=New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(116,169,234))
$outer=[Drawing.PointF[]]@([Drawing.PointF]::new(128,28),[Drawing.PointF]::new(24,229),[Drawing.PointF]::new(63,229),[Drawing.PointF]::new(89,151),[Drawing.PointF]::new(167,151),[Drawing.PointF]::new(193,229),[Drawing.PointF]::new(232,229))
$graphics.FillPolygon($brush,$outer)
$inner=New-Object Drawing.SolidBrush ([Drawing.Color]::FromArgb(24,42,70))
$graphics.FillPolygon($inner,[Drawing.PointF[]]@([Drawing.PointF]::new(109,127),[Drawing.PointF]::new(128,69),[Drawing.PointF]::new(147,127)))
$stream=New-Object IO.MemoryStream
$bitmap.Save($stream,[Drawing.Imaging.ImageFormat]::Png)
$png=$stream.ToArray()
[IO.File]::WriteAllBytes((Join-Path $assetDirectory 'icon.png'),$png)
$file=[IO.File]::Create((Join-Path $assetDirectory 'icon.ico'))
$writer=New-Object IO.BinaryWriter $file
$writer.Write([uint16]0);$writer.Write([uint16]1);$writer.Write([uint16]1)
$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([byte]0);$writer.Write([byte]0)
$writer.Write([uint16]1);$writer.Write([uint16]32);$writer.Write([uint32]$png.Length);$writer.Write([uint32]22);$writer.Write($png)
$writer.Dispose();$stream.Dispose();$brush.Dispose();$inner.Dispose();$graphics.Dispose();$bitmap.Dispose()
