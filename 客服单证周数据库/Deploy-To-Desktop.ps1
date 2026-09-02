#Requires -Version 5.1
# ASCII-only source so Windows PowerShell 5.1 always parses it.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$src = Split-Path -Parent $MyInvocation.MyCommand.Path
$zhDesktop = ([string][char]0x684C) + ([string][char]0x9762)  # Desktop in Chinese

$homes = @(
    'C:\Users\jason.jiang',
    $env:USERPROFILE
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

$deskNames = @($zhDesktop, 'Desktop')
$targetRoot = $null
foreach ($home in $homes) {
    foreach ($name in $deskNames) {
        $candidate = Join-Path $home $name
        if (Test-Path -LiteralPath $candidate) {
            $targetRoot = $candidate
            break
        }
    }
    if ($targetRoot) { break }
}

if (-not $targetRoot) {
    $fallbackHome = if (Test-Path -LiteralPath 'C:\Users\jason.jiang') { 'C:\Users\jason.jiang' } else { $env:USERPROFILE }
    $targetRoot = Join-Path $fallbackHome 'Desktop'
}

$target = Join-Path $targetRoot 'Tool'
Write-Host ''
Write-Host ('Deploy target: ' + $target)
Write-Host ''

New-Item -ItemType Directory -Path $target -Force | Out-Null

$skip = @(
    'Deploy-To-Desktop.bat',
    'Deploy-To-Desktop.ps1',
    'Deploy-To-Y.bat',
    '.git',
    '__pycache__'
)

Get-ChildItem -LiteralPath $src -Force | Where-Object {
    $skip -notcontains $_.Name
} | ForEach-Object {
    $dest = Join-Path $target $_.Name
    Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force
}

Write-Host 'Deploy finished.'
Write-Host ('Run: ' + (Join-Path $target 'Start.bat'))
Write-Host ''
Start-Process explorer.exe -ArgumentList $target
Read-Host 'Press Enter to close'
