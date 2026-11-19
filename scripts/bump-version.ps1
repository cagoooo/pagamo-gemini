# 升版：同步 version.json、sw.js、index.html 的版本號（含 ?v= 快取參數與頁尾版本膠囊）
# 用法：powershell -File scripts/bump-version.ps1 -Version 1.5.0 -Notes "改了什麼"
#       不給 -Version 時自動把最後一碼 +1
param([string]$Version = "", [string]$Notes = "內容更新")
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$enc = New-Object System.Text.UTF8Encoding($false)
$vp = Join-Path $root "version.json"
$old = (Get-Content $vp -Raw -Encoding UTF8 | ConvertFrom-Json).version
if (-not $Version) {
  $p = $old.Split('.'); $p[2] = [string]([int]$p[2] + 1); $Version = $p -join '.'
}
if ($Version -notmatch '^\d+\.\d+\.\d+$') { throw "版本號格式要像 1.5.0" }
$json = "{`n  `"version`": `"$Version`",`n  `"notes`": `"$Notes`"`n}`n"
[System.IO.File]::WriteAllText($vp, $json, $enc)
$oldRe = [regex]::Escape($old)
foreach ($f in @("sw.js", "index.html")) {
  $path = Join-Path $root $f
  $t = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $t = [regex]::Replace($t, "BUILD_VERSION = '$oldRe'", "BUILD_VERSION = '$Version'")
  $t = [regex]::Replace($t, "\?v=$oldRe", "?v=$Version")
  $t = [regex]::Replace($t, "name=`"build-version`" content=`"$oldRe`"", "name=`"build-version`" content=`"$Version`"")
  $t = [regex]::Replace($t, "id=`"ver`">v$oldRe<", "id=`"ver`">v$Version<")
  [System.IO.File]::WriteAllText($path, $t, $enc)
}
Write-Host "已升版 $old -> $Version（接著 git add -A; git commit; git push）"
