# PowerShell script to package BlockCertify project into a clean zip archive

$sourceDir = $PSScriptRoot | Split-Path -Parent
$zipName = "BlockCertify_v1.0.0.zip"
$outputPath = Join-Path $sourceDir $zipName
$stageDir = Join-Path $env:TEMP "BlockCertify_Stage"

Write-Host "Creating zip package: $outputPath" -ForegroundColor Cyan

if (Test-Path $stageDir) {
    Remove-Item -Path $stageDir -Recurse -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $stageDir -Force | Out-Null

$items = Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object {
    $_.FullName -notmatch '\\(node_modules|\.next|dist|\.git|\.cache)\\' -and
    $_.Name -ne "BlockCertify_v1.0.0.zip" -and
    $_.Extension -ne ".zip"
}

foreach ($item in $items) {
    $relPath = $item.FullName.Substring($sourceDir.Length + 1)
    $destFile = Join-Path $stageDir $relPath
    $destDir = [System.IO.Path]::GetDirectoryName($destFile)
    if (-not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    }
    Copy-Item -Path $item.FullName -Destination $destFile -Force
}

if (Test-Path $outputPath) {
    Remove-Item -Path $outputPath -Force -ErrorAction SilentlyContinue
}

Compress-Archive -Path "$stageDir\*" -DestinationPath $outputPath -CompressionLevel Optimal -Force

Remove-Item -Path $stageDir -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Zip package created successfully: $outputPath" -ForegroundColor Green
