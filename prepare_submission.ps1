param(
    [string]$OutputPath = "dist\\PixelProof-submission.zip",
    [string]$Ref = "HEAD"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path $PSScriptRoot).Path
$zipPath = Join-Path $repoRoot $OutputPath
$zipDir = Split-Path -Parent $zipPath

git -C $repoRoot rev-parse --is-inside-work-tree | Out-Null

if (-not (Test-Path $zipDir)) {
    New-Item -ItemType Directory -Path $zipDir -Force | Out-Null
}

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

git -C $repoRoot archive --format=zip --output="$zipPath" $Ref

Write-Host "Created submission archive:" -ForegroundColor Green
Write-Host "  $zipPath"
