Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'C:\Users\cheat\OneDrive\Documents\slimegarden (35).zip'
$extractDir = 'C:\Github\RFDGameStudio\temp_slimegarden35'
if (Test-Path $extractDir) { Remove-Item $extractDir -Recurse -Force }
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extractDir)
Write-Output "=== ZIP CONTENTS (src/) ==="
Get-ChildItem -Recurse $extractDir\src | Where-Object { -not $_.PSIsContainer } | ForEach-Object { Write-Output ("{0,8} {1}" -f $_.Length, $_.FullName.Substring($extractDir.Length+1)) }
Write-Output ""
Write-Output "=== DIFF vs examples/slimeworld/src ==="
$diff = git diff --no-index --stat $extractDir\src examples\slimeworld\src 2>&1
Write-Output $diff
Write-Output ""
Write-Output "=== FILE COUNT COMPARISON ==="
$zipCount = (Get-ChildItem -Recurse $extractDir\src -File).Count
$exCount = (Get-ChildItem -Recurse examples\slimeworld\src -File).Count
Write-Output "Zip src/ files: $zipCount"
Write-Output "Examples src/ files: $exCount"
