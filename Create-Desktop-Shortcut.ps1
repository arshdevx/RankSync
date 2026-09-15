$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "RankSync.lnk"
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
if (Test-Path "$PSScriptRoot\RankSync-Windows\RankSync.exe") {
  $sc.TargetPath = "$PSScriptRoot\RankSync-Windows\RankSync.exe"
} else {
  $sc.TargetPath = "$PSScriptRoot\Launch-RankSync.bat"
}
$sc.WorkingDirectory = "$PSScriptRoot"
$sc.Description = "RankSync — Academic Mission Control"
$sc.Save()
Write-Host "Desktop shortcut created: $shortcutPath"
