#Requires -Version 5.1
Set-StrictMode -Version Latest

function Get-AppRoot {
    if ($script:AppRoot -and (Test-Path -LiteralPath $script:AppRoot)) {
        return $script:AppRoot
    }
    if ($PSScriptRoot) {
        # lib 目录的上一级为应用根
        $parent = Split-Path -Parent $PSScriptRoot
        if (Test-Path -LiteralPath (Join-Path $parent 'config.json')) {
            return $parent
        }
        return $PSScriptRoot
    }
    return (Split-Path -Parent $MyInvocation.MyCommand.Path)
}

function Read-AppConfig {
    param(
        [Parameter(Mandatory = $false)]
        [string]$ConfigPath
    )

    if (-not $ConfigPath) {
        $ConfigPath = Join-Path (Get-AppRoot) 'config.json'
    }
    if (-not (Test-Path -LiteralPath $ConfigPath)) {
        throw "找不到配置文件: $ConfigPath"
    }

    $raw = Get-Content -LiteralPath $ConfigPath -Encoding UTF8 -Raw
    $cfg = $raw | ConvertFrom-Json

    if (-not $cfg.columns -or @($cfg.columns).Count -eq 0) {
        throw 'config.json 中 columns 不能为空'
    }
    if (-not $cfg.maxRecords -or [int]$cfg.maxRecords -le 0) {
        $cfg | Add-Member -NotePropertyName maxRecords -NotePropertyValue 1000 -Force
    }
    if (-not $cfg.retentionDays -or [int]$cfg.retentionDays -le 0) {
        $cfg | Add-Member -NotePropertyName retentionDays -NotePropertyValue 7 -Force
    }
    if (-not $cfg.timestampColumn) {
        $cfg | Add-Member -NotePropertyName timestampColumn -NotePropertyValue '录入时间' -Force
    }
    if (-not $cfg.operatorColumn) {
        $cfg | Add-Member -NotePropertyName operatorColumn -NotePropertyValue '录入人' -Force
    }
    if (-not $cfg.sheetName) {
        $cfg | Add-Member -NotePropertyName sheetName -NotePropertyValue 'Records' -Force
    }
    if (-not $cfg.databaseFileName) {
        $cfg | Add-Member -NotePropertyName databaseFileName -NotePropertyValue 'WeeklyDatabase.xlsx' -Force
    }

    return $cfg
}

function Get-DatabasePath {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [switch]$PreferLocalFallback
    )

    $candidates = New-Object System.Collections.Generic.List[string]
    $configured = [string]$Config.dataFolder
    if ($configured) { [void]$candidates.Add($configured) }

    # 中文 Windows「桌面」与英文 Desktop 互通
    if ($configured -match '\\桌面\\') {
        [void]$candidates.Add(($configured -replace '\\桌面\\', '\Desktop\'))
    }
    elseif ($configured -match '\\Desktop\\') {
        [void]$candidates.Add(($configured -replace '\\Desktop\\', '\桌面\'))
    }

    $folder = $null
    foreach ($c in $candidates) {
        $parent = Split-Path -Parent $c
        if ($parent -and (Test-Path -LiteralPath $parent)) {
            if (-not (Test-Path -LiteralPath $c)) {
                New-Item -ItemType Directory -Path $c -Force | Out-Null
            }
            if (Test-Path -LiteralPath $c) {
                $folder = $c
                break
            }
        }
        elseif (Test-Path -LiteralPath $c) {
            $folder = $c
            break
        }
    }

    if ($PreferLocalFallback -or -not $folder) {
        $local = Join-Path (Get-AppRoot) 'data'
        if (-not (Test-Path -LiteralPath $local)) {
            New-Item -ItemType Directory -Path $local -Force | Out-Null
        }
        return (Join-Path $local $Config.databaseFileName)
    }
    return (Join-Path $folder $Config.databaseFileName)
}

function Get-BusinessColumnNames {
    param([Parameter(Mandatory = $true)]$Config)
    return @($Config.columns | ForEach-Object { [string]$_.name })
}

function Get-AllColumnNames {
    param([Parameter(Mandatory = $true)]$Config)
    $names = Get-BusinessColumnNames -Config $Config
    $names += [string]$Config.timestampColumn
    $names += [string]$Config.operatorColumn
    return $names
}
