#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = 'Y:\03_Exchange\03_Among Supply Chain\05_' + ([string][char]0x7269) + ([string][char]0x6D41) + ([string][char]0x5355) + ([string][char]0x8BC1) + '\Tool'
$zhWeek = ([string][char]0x5468) + ([string][char]0x6570) + ([string][char]0x636E) + ([string][char]0x5E93)
$dest = Join-Path $target $zhWeek

Write-Host ''
Write-Host ('Deploy target: ' + $dest)
Write-Host ''

if (-not (Test-Path -LiteralPath $target)) {
    throw "Target folder not found: $target"
}

New-Item -ItemType Directory -Path $dest -Force | Out-Null

$skip = @('Deploy-To-Desktop.bat', 'Deploy-To-Desktop.ps1', 'Deploy-To-Y.bat', 'Deploy-To-Y.ps1', '.git', '__pycache__', 'data')
Get-ChildItem -LiteralPath $src -Force | Where-Object { $skip -notcontains $_.Name } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $dest $_.Name) -Recurse -Force
}

Write-Host 'Deploy finished.'
Start-Process explorer.exe -ArgumentList $dest
Read-Host 'Press Enter to close'
