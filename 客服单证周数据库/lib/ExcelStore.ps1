#Requires -Version 5.1
Set-StrictMode -Version Latest

function New-EmptyRecordTable {
    param([Parameter(Mandatory = $true)]$Config)
    $table = New-Object System.Data.DataTable 'Records'
    foreach ($name in (Get-AllColumnNames -Config $Config)) {
        [void]$table.Columns.Add($name, [string])
    }
    return $table
}

function Convert-RecordsToDataTable {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)]
        [AllowEmptyCollection()]
        [object[]]$Records
    )

    $table = New-EmptyRecordTable -Config $Config
    $cols = Get-AllColumnNames -Config $Config
    foreach ($rec in @($Records)) {
        $row = $table.NewRow()
        foreach ($c in $cols) {
            if ($rec.PSObject.Properties.Name -contains $c) {
                $row[$c] = [string]$rec.$c
            }
            else {
                $row[$c] = ''
            }
        }
        [void]$table.Rows.Add($row)
    }
    return $table
}

function Convert-DataTableToRecords {
    param([Parameter(Mandatory = $true)][System.Data.DataTable]$Table)
    $list = @()
    foreach ($row in $Table.Rows) {
        $obj = [ordered]@{}
        foreach ($col in $Table.Columns) {
            $obj[[string]$col.ColumnName] = [string]$row[[string]$col.ColumnName]
        }
        $list += [pscustomobject]$obj
    }
    return $list
}

function Invoke-WithExcelRetry {
    param(
        [scriptblock]$Action,
        [int]$Retries = 8,
        [int]$DelayMs = 400
    )
    $last = $null
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            return & $Action
        }
        catch {
            $last = $_
            Start-Sleep -Milliseconds $DelayMs
        }
    }
    throw $last
}

function Read-ExcelDatabase {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return (New-EmptyRecordTable -Config $Config)
    }

    return Invoke-WithExcelRetry -Action {
        $excel = $null
        $wb = $null
        $ws = $null
        try {
            $excel = New-Object -ComObject Excel.Application
            $excel.Visible = $false
            $excel.DisplayAlerts = $false
            $wb = $excel.Workbooks.Open($Path, 0, $true)
            foreach ($sheet in @($wb.Worksheets)) {
                if ($sheet.Name -eq [string]$Config.sheetName) {
                    $ws = $sheet
                    break
                }
            }
            if (-not $ws) {
                $ws = $wb.Worksheets.Item(1)
            }

            $used = $ws.UsedRange
            if (-not $used -or $used.Rows.Count -lt 1) {
                return (New-EmptyRecordTable -Config $Config)
            }

            $rowCount = [int]$used.Rows.Count
            $colCount = [int]$used.Columns.Count
            $headers = @()
            for ($c = 1; $c -le $colCount; $c++) {
                $headers += [string]$used.Cells.Item(1, $c).Text
            }

            $expected = Get-AllColumnNames -Config $Config
            $table = New-EmptyRecordTable -Config $Config

            for ($r = 2; $r -le $rowCount; $r++) {
                $values = @{}
                for ($c = 1; $c -le $colCount; $c++) {
                    $h = $headers[$c - 1]
                    if ($h) {
                        $values[$h] = [string]$used.Cells.Item($r, $c).Text
                    }
                }
                # 跳过全空行
                $any = $false
                foreach ($k in @($values.Keys)) {
                    if (-not [string]::IsNullOrWhiteSpace([string]$values[$k])) { $any = $true; break }
                }
                if (-not $any) { continue }

                $row = $table.NewRow()
                foreach ($name in $expected) {
                    if ($values.ContainsKey($name)) {
                        $row[$name] = [string]$values[$name]
                    }
                    else {
                        $row[$name] = ''
                    }
                }
                [void]$table.Rows.Add($row)
            }
            return $table
        }
        finally {
            if ($wb) { try { $wb.Close($false) | Out-Null } catch {} }
            if ($excel) { try { $excel.Quit() | Out-Null } catch {} }
            if ($ws) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) } catch {} }
            if ($wb) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) } catch {} }
            if ($excel) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) } catch {} }
            [GC]::Collect()
            [GC]::WaitForPendingFinalizers()
        }
    }
}

function Write-ExcelDatabase {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][System.Data.DataTable]$Table
    )

    $folder = Split-Path -Parent $Path
    if (-not (Test-Path -LiteralPath $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $temp = Join-Path $folder ("~tmp_{0}_{1}.xlsx" -f ([guid]::NewGuid().ToString('N').Substring(0, 8)), (Get-Date -Format 'HHmmss'))

    Invoke-WithExcelRetry -Action {
        $excel = $null
        $wb = $null
        $ws = $null
        try {
            $excel = New-Object -ComObject Excel.Application
            $excel.Visible = $false
            $excel.DisplayAlerts = $false
            $wb = $excel.Workbooks.Add()
            $ws = $wb.Worksheets.Item(1)
            $ws.Name = [string]$Config.sheetName

            $cols = Get-AllColumnNames -Config $Config
            for ($c = 0; $c -lt $cols.Count; $c++) {
                $ws.Cells.Item(1, $c + 1) = $cols[$c]
                $ws.Cells.Item(1, $c + 1).Font.Bold = $true
            }

            $r = 2
            foreach ($row in $Table.Rows) {
                for ($c = 0; $c -lt $cols.Count; $c++) {
                    $ws.Cells.Item($r, $c + 1) = [string]$row[$cols[$c]]
                }
                $r++
            }

            $ws.Columns.AutoFit() | Out-Null
            # 51 = xlOpenXMLWorkbook (.xlsx)
            $wb.SaveAs($temp, 51) | Out-Null
            $wb.Close($true) | Out-Null
            $wb = $null
        }
        finally {
            if ($wb) { try { $wb.Close($false) } catch {} }
            if ($excel) { try { $excel.Quit() } catch {} }
            if ($ws) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) } catch {} }
            if ($wb) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) } catch {} }
            if ($excel) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) } catch {} }
            [GC]::Collect()
            [GC]::WaitForPendingFinalizers()
        }
    }

    # 替换目标文件（共享盘上可能短暂锁定，重试）
    Invoke-WithExcelRetry -Action {
        if (Test-Path -LiteralPath $Path) {
            Remove-Item -LiteralPath $Path -Force -ErrorAction Stop
        }
        Move-Item -LiteralPath $temp -Destination $Path -Force -ErrorAction Stop
    } | Out-Null
}

function Import-ExcelFileRows {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$Path
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        throw "文件不存在: $Path"
    }

    $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
    if ($ext -eq '.csv' -or $ext -eq '.txt' -or $ext -eq '.tsv') {
        $text = Get-Content -LiteralPath $Path -Encoding UTF8 -Raw
        $rawRows = Split-ClipboardOrTsvText -Text $text
        return Convert-RawRowsToRecords -Config $Config -RawRows $rawRows
    }

    return Invoke-WithExcelRetry -Action {
        $excel = $null
        $wb = $null
        $ws = $null
        try {
            $excel = New-Object -ComObject Excel.Application
            $excel.Visible = $false
            $excel.DisplayAlerts = $false
            $wb = $excel.Workbooks.Open($Path, 0, $true)
            $ws = $wb.Worksheets.Item(1)
            $used = $ws.UsedRange
            if (-not $used) {
                return @()
            }
            $rowCount = [int]$used.Rows.Count
            $colCount = [int]$used.Columns.Count
            $rawRows = @()
            for ($r = 1; $r -le $rowCount; $r++) {
                $parts = @()
                for ($c = 1; $c -le $colCount; $c++) {
                    $parts += [string]$used.Cells.Item($r, $c).Text
                }
                # 跳过完全空行
                $joined = ($parts -join '').Trim()
                if ($joined -ne '') {
                    $rawRows += , $parts
                }
            }
            return Convert-RawRowsToRecords -Config $Config -RawRows $rawRows
        }
        finally {
            if ($wb) { try { $wb.Close($false) | Out-Null } catch {} }
            if ($excel) { try { $excel.Quit() | Out-Null } catch {} }
            if ($ws) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) } catch {} }
            if ($wb) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) } catch {} }
            if ($excel) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) } catch {} }
            [GC]::Collect()
            [GC]::WaitForPendingFinalizers()
        }
    }
}

function Export-ImportTemplate {
    param(
        [Parameter(Mandatory = $true)]$Config,
        [Parameter(Mandatory = $true)][string]$Path
    )

    $folder = Split-Path -Parent $Path
    if ($folder -and -not (Test-Path -LiteralPath $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }

    $headers = Get-BusinessColumnNames -Config $Config
    $excel = $null
    $wb = $null
    $ws = $null
    try {
        $excel = New-Object -ComObject Excel.Application
        $excel.Visible = $false
        $excel.DisplayAlerts = $false
        $wb = $excel.Workbooks.Add()
        $ws = $wb.Worksheets.Item(1)
        $ws.Name = 'Import'
        for ($i = 0; $i -lt $headers.Count; $i++) {
            $ws.Cells.Item(1, $i + 1) = $headers[$i]
            $ws.Cells.Item(1, $i + 1).Font.Bold = $true
        }
        # 示例行
        if ($headers.Count -gt 0) {
            $ws.Cells.Item(2, 1) = (Get-Date -Format 'yyyy-MM-dd')
        }
        if ($headers.Count -gt 1) {
            $ws.Cells.Item(2, 2) = '示例单号001'
        }
        $ws.Columns.AutoFit() | Out-Null
        $wb.SaveAs($Path, 51) | Out-Null
        $wb.Close($true) | Out-Null
        $wb = $null
    }
    finally {
        if ($wb) { try { $wb.Close($false) } catch {} }
        if ($excel) { try { $excel.Quit() } catch {} }
        if ($ws) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($ws) } catch {} }
        if ($wb) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) } catch {} }
        if ($excel) { try { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) } catch {} }
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
    }
}
