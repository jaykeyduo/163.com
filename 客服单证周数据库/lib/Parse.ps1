#Requires -Version 5.1
Set-StrictMode -Version Latest

function ConvertTo-NormalizedHeader {
    param([string]$Text)
    if ($null -eq $Text) { return '' }
    return ($Text.Trim() -replace '\s+', '')
}

function Split-ClipboardOrTsvText {
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Text
    )

    if ([string]::IsNullOrWhiteSpace($Text)) {
        return @()
    }

    $normalized = $Text -replace "`r`n", "`n" -replace "`r", "`n"
    $lines = $normalized -split "`n" | ForEach-Object { $_.TrimEnd() } | Where-Object { $_ -ne '' }
    $rows = @()
    foreach ($line in $lines) {
        # Excel 复制通常为 Tab 分隔；也兼容逗号/分号（简单场景，不含复杂引号嵌套时）
        if ($line.Contains("`t")) {
            $parts = $line -split "`t"
        }
        elseif ($line.Contains(';')) {
            $parts = $line -split ';'
        }
        else {
            $parts = $line -split ','
        }
        $rows += , (@($parts | ForEach-Object { $_.Trim().Trim('"') }))
    }
    return $rows
}

function Convert-RawRowsToRecords {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)]
        [object[]]$RawRows,
        [string]$Operator = $env:USERNAME
    )

    $businessCols = @(Get-BusinessColumnNames -Config $Config)
    if (-not $RawRows -or $RawRows.Count -eq 0) {
        return @()
    }

    $startIndex = 0
    $headerMap = $null
    $first = @($RawRows[0])
    $normalizedFirst = @($first | ForEach-Object { ConvertTo-NormalizedHeader $_ })
    $normalizedBusiness = @($businessCols | ForEach-Object { ConvertTo-NormalizedHeader $_ })

    $matchCount = 0
    foreach ($h in $normalizedFirst) {
        if ($normalizedBusiness -contains $h) { $matchCount++ }
    }
    if ($matchCount -ge [Math]::Max(1, [Math]::Ceiling($businessCols.Count / 2))) {
        $headerMap = @{}
        for ($i = 0; $i -lt $first.Count; $i++) {
            $n = ConvertTo-NormalizedHeader $first[$i]
            for ($c = 0; $c -lt $businessCols.Count; $c++) {
                if ((ConvertTo-NormalizedHeader $businessCols[$c]) -eq $n) {
                    $headerMap[$businessCols[$c]] = $i
                }
            }
        }
        $startIndex = 1
    }

    $now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    if (-not $Operator) { $Operator = 'unknown' }

    $records = @()
    for ($r = $startIndex; $r -lt $RawRows.Count; $r++) {
        $row = @($RawRows[$r])
        $obj = [ordered]@{}
        foreach ($col in $businessCols) {
            $value = ''
            if ($null -ne $headerMap) {
                if ($headerMap.ContainsKey($col)) {
                    $idx = [int]$headerMap[$col]
                    if ($idx -lt $row.Count) { $value = [string]$row[$idx] }
                }
            }
            else {
                $idx = [array]::IndexOf($businessCols, $col)
                if ($idx -ge 0 -and $idx -lt $row.Count) { $value = [string]$row[$idx] }
            }
            $obj[$col] = $value
        }

        $missing = @()
        foreach ($colDef in $Config.columns) {
            if ($colDef.required -and [string]::IsNullOrWhiteSpace([string]$obj[[string]$colDef.name])) {
                $missing += [string]$colDef.name
            }
        }
        if ($missing.Count -gt 0) {
            throw ("第 {0} 行缺少必填字段: {1}" -f ($r + 1), ($missing -join ', '))
        }

        $obj[[string]$Config.timestampColumn] = $now
        $obj[[string]$Config.operatorColumn] = $Operator
        $records += [pscustomobject]$obj
    }

    return $records
}

function Test-RecordCapacity {
    param(
        [Parameter(Mandatory = $true)][int]$CurrentCount,
        [Parameter(Mandatory = $true)][int]$IncomingCount,
        [Parameter(Mandatory = $true)][int]$MaxRecords
    )

    $total = $CurrentCount + $IncomingCount
    return [pscustomobject]@{
        Allowed = ($total -le $MaxRecords)
        Current = $CurrentCount
        Incoming = $IncomingCount
        Total   = $total
        Max     = $MaxRecords
        Remaining = [Math]::Max(0, $MaxRecords - $CurrentCount)
    }
}

function Select-RecordsWithinRetention {
    param(
        [Parameter(Mandatory = $true)][object[]]$Records,
        [Parameter(Mandatory = $true)]$Config,
        [datetime]$AsOf = (Get-Date)
    )

    $days = [int]$Config.retentionDays
    $cutoff = $AsOf.Date.AddDays(-1 * ($days - 1))
    $tsName = [string]$Config.timestampColumn
    $kept = @()
    foreach ($rec in @($Records)) {
        $raw = $null
        if ($rec.PSObject.Properties.Name -contains $tsName) {
            $raw = [string]$rec.$tsName
        }
        $dt = $null
        if ($raw -and [datetime]::TryParse($raw, [ref]$dt)) {
            if ($dt.Date -ge $cutoff) {
                $kept += $rec
            }
        }
        else {
            # 无法解析时间戳时保守保留，避免误删
            $kept += $rec
        }
    }
    return $kept
}
