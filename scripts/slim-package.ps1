$src = "PCM-Tracker-Windows"
$dest = "PCM-Tracker-Portable"

if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
robocopy $src $dest /E /R:1 /W:1 | Out-Null

# Prune unused locales (keep only en-US.pak)
Get-ChildItem "$dest\locales" -Filter "*.pak" | Where-Object { $_.Name -ne "en-US.pak" } | Remove-Item -Force

# Prune 20MB license file
if (Test-Path "$dest\LICENSES.chromium.html") { Remove-Item "$dest\LICENSES.chromium.html" -Force }

# Measure new uncompressed size
$uncompressed = (Get-ChildItem $dest -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round(($uncompressed / 1MB), 2)
Write-Output "Slimmed uncompressed size: $sizeMB MB"

# Create slim zip
$zipPath = "PCM-Tracker-Windows-Slim.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$dest\*" -DestinationPath $zipPath -Force

$zipSize = (Get-Item $zipPath).Length
$zipSizeMB = [math]::Round(($zipSize / 1MB), 2)
Write-Output "Slimmed ZIP size: $zipSizeMB MB"

# Clean up temp folder
Remove-Item $dest -Recurse -Force
Write-Output "SUCCESS: Package ready at $zipPath"
