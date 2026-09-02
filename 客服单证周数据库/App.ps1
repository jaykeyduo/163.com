#Requires -Version 5.1
# 客服单证周数据库 UI
# 依赖: Windows PowerShell 5.1 + .NET WinForms + 本机已安装 Microsoft Excel
# 无需管理员权限，无需安装额外软件

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
. (Join-Path $root 'lib\Config.ps1')
. (Join-Path $root 'lib\Parse.ps1')
. (Join-Path $root 'lib\ExcelStore.ps1')

$script:AppRoot = $root
$script:Config = Read-AppConfig -ConfigPath (Join-Path $root 'config.json')
$script:UsingLocalFallback = $false
$dbPath = Get-DatabasePath -Config $script:Config
if (-not (Test-Path -LiteralPath ([string]$script:Config.dataFolder))) {
    $script:UsingLocalFallback = $true
    $dbPath = Get-DatabasePath -Config $script:Config -PreferLocalFallback
}
$script:DbPath = $dbPath
$script:Table = New-EmptyRecordTable -Config $script:Config
$script:PendingImport = @()

function Update-StatusBar {
    param($Label)
    $count = $script:Table.Rows.Count
    $mode = if ($script:UsingLocalFallback) { '本地兜底目录' } else { 'Sharefolder' }
    $Label.Text = ("记录数: {0}/{1}  |  保留约 {2} 天  |  存储: {3}  |  {4}" -f `
        $count, [int]$script:Config.maxRecords, [int]$script:Config.retentionDays, $mode, $script:DbPath)
}

function Load-DatabaseIntoGrid {
    param($Grid, $StatusLabel)
    $script:Table = Read-ExcelDatabase -Config $script:Config -Path $script:DbPath
    # 先按保留期裁剪显示/后续保存时也会裁剪
    $records = Convert-DataTableToRecords -Table $script:Table
    $kept = Select-RecordsWithinRetention -Records $records -Config $script:Config
    $script:Table = Convert-RecordsToDataTable -Config $script:Config -Records $kept
    $Grid.DataSource = $script:Table
    Update-StatusBar -Label $StatusLabel
}

function Save-DatabaseFromTable {
    param($StatusLabel)
    $records = Convert-DataTableToRecords -Table $script:Table
    $kept = Select-RecordsWithinRetention -Records $records -Config $script:Config
    if ($kept.Count -gt [int]$script:Config.maxRecords) {
        throw ("当前有效记录 {0} 条，超过上限 {1}。请先删除部分记录或清理过期数据。" -f $kept.Count, [int]$script:Config.maxRecords)
    }
    $script:Table = Convert-RecordsToDataTable -Config $script:Config -Records $kept
    Write-ExcelDatabase -Config $script:Config -Path $script:DbPath -Table $script:Table
    Update-StatusBar -Label $StatusLabel
}

function Add-RecordsToDatabase {
    param(
        [object[]]$Records,
        $Grid,
        $StatusLabel
    )

    if (-not $Records -or $Records.Count -eq 0) {
        throw '没有可提交的记录'
    }

    $cap = Test-RecordCapacity -CurrentCount $script:Table.Rows.Count -IncomingCount $Records.Count -MaxRecords ([int]$script:Config.maxRecords)
    if (-not $cap.Allowed) {
        throw ("提交后将达到 {0} 条，超过上限 {1}（还可提交约 {2} 条）。" -f $cap.Total, $cap.Max, $cap.Remaining)
    }

    foreach ($rec in $Records) {
        $row = $script:Table.NewRow()
        foreach ($col in $script:Table.Columns) {
            $name = [string]$col.ColumnName
            if ($rec.PSObject.Properties.Name -contains $name) {
                $row[$name] = [string]$rec.$name
            }
            else {
                $row[$name] = ''
            }
        }
        [void]$script:Table.Rows.Add($row)
    }

    Save-DatabaseFromTable -StatusLabel $StatusLabel
    $Grid.DataSource = $null
    $Grid.DataSource = $script:Table
    Update-StatusBar -Label $StatusLabel
}

function Show-ErrorDialog {
    param([string]$Message)
    [System.Windows.Forms.MessageBox]::Show($Message, '错误', 'OK', 'Error') | Out-Null
}

function Show-InfoDialog {
    param([string]$Message)
    [System.Windows.Forms.MessageBox]::Show($Message, '提示', 'OK', 'Information') | Out-Null
}

# ---------------- UI ----------------
$form = New-Object System.Windows.Forms.Form
$form.Text = [string]$script:Config.appTitle
$form.StartPosition = 'CenterScreen'
$form.Size = New-Object System.Drawing.Size(1100, 720)
$form.MinimumSize = New-Object System.Drawing.Size(900, 600)
$form.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 9)

$split = New-Object System.Windows.Forms.SplitContainer
$split.Dock = 'Fill'
$split.Orientation = 'Horizontal'
$split.SplitterDistance = 280
$form.Controls.Add($split)

# ---- Top: grid ----
$panelTop = $split.Panel1
$panelTop.Padding = New-Object System.Windows.Forms.Padding(8)

$grid = New-Object System.Windows.Forms.DataGridView
$grid.Dock = 'Fill'
$grid.AllowUserToAddRows = $false
$grid.AllowUserToDeleteRows = $false
$grid.ReadOnly = $true
$grid.SelectionMode = 'FullRowSelect'
$grid.MultiSelect = $true
$grid.AutoSizeColumnsMode = 'DisplayedCells'
$grid.RowHeadersVisible = $false
$panelTop.Controls.Add($grid)

$tool = New-Object System.Windows.Forms.FlowLayoutPanel
$tool.Dock = 'Top'
$tool.Height = 36
$tool.FlowDirection = 'LeftToRight'
$panelTop.Controls.Add($tool)

$lblGrid = New-Object System.Windows.Forms.Label
$lblGrid.Text = '当前库内数据（最多约一周 / 1000 条）'
$lblGrid.Dock = 'Top'
$lblGrid.Height = 24
$panelTop.Controls.Add($lblGrid)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = '刷新'
$btnRefresh.Width = 80
$tool.Controls.Add($btnRefresh)

$btnDelete = New-Object System.Windows.Forms.Button
$btnDelete.Text = '删除选中'
$btnDelete.Width = 90
$tool.Controls.Add($btnDelete)

$btnPurge = New-Object System.Windows.Forms.Button
$btnPurge.Text = '清理过期'
$btnPurge.Width = 90
$tool.Controls.Add($btnPurge)

$btnTemplate = New-Object System.Windows.Forms.Button
$btnTemplate.Text = '导出上传模板'
$btnTemplate.Width = 120
$tool.Controls.Add($btnTemplate)

$btnOpenFolder = New-Object System.Windows.Forms.Button
$btnOpenFolder.Text = '打开数据目录'
$btnOpenFolder.Width = 110
$tool.Controls.Add($btnOpenFolder)

$status = New-Object System.Windows.Forms.Label
$status.Dock = 'Bottom'
$status.Height = 28
$status.TextAlign = 'MiddleLeft'
$form.Controls.Add($status)

# ---- Bottom: tabs ----
$tabs = New-Object System.Windows.Forms.TabControl
$tabs.Dock = 'Fill'
$split.Panel2.Controls.Add($tabs)

# Tab 1: manual
$tabManual = New-Object System.Windows.Forms.TabPage
$tabManual.Text = '手工录入'
$tabs.TabPages.Add($tabManual)

$manualPanel = New-Object System.Windows.Forms.TableLayoutPanel
$manualPanel.Dock = 'Fill'
$manualPanel.ColumnCount = 2
$manualPanel.Padding = New-Object System.Windows.Forms.Padding(10)
$manualPanel.ColumnStyles.Add((New-Object System.Windows.Forms.ColumnStyle([System.Windows.Forms.SizeType]::Absolute, 110)))
$manualPanel.ColumnStyles.Add((New-Object System.Windows.Forms.ColumnStyle([System.Windows.Forms.SizeType]::Percent, 100)))
$tabManual.Controls.Add($manualPanel)

$inputBoxes = @{}
$rowIndex = 0
foreach ($col in $script:Config.columns) {
    $manualPanel.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Absolute, 32)))
    $name = [string]$col.name
    $lbl = New-Object System.Windows.Forms.Label
    $req = ''
    if ($col.required) { $req = ' *' }
    $lbl.Text = "$name$req"
    $lbl.TextAlign = 'MiddleLeft'
    $lbl.Dock = 'Fill'
    $tb = New-Object System.Windows.Forms.TextBox
    $tb.Dock = 'Fill'
    if ($col.width) { $tb.Width = [int]$col.width }
    $manualPanel.Controls.Add($lbl, 0, $rowIndex)
    $manualPanel.Controls.Add($tb, 1, $rowIndex)
    $inputBoxes[$name] = $tb
    $rowIndex++
}

$manualPanel.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Absolute, 40)))
$btnSubmitManual = New-Object System.Windows.Forms.Button
$btnSubmitManual.Text = '提交到数据库'
$btnSubmitManual.Width = 140
$btnSubmitManual.Height = 30
$manualPanel.Controls.Add($btnSubmitManual, 1, $rowIndex)

$hintManual = New-Object System.Windows.Forms.Label
$hintManual.Dock = 'Bottom'
$hintManual.Height = 40
$hintManual.Text = "提示: 可在各输入框中 Ctrl+V 粘贴单元格内容；带 * 为必填。提交后写入: $($script:DbPath)"
$tabManual.Controls.Add($hintManual)

# Tab 2: paste
$tabPaste = New-Object System.Windows.Forms.TabPage
$tabPaste.Text = '粘贴整条/多条'
$tabs.TabPages.Add($tabPaste)

$pasteLayout = New-Object System.Windows.Forms.TableLayoutPanel
$pasteLayout.Dock = 'Fill'
$pasteLayout.RowCount = 3
$pasteLayout.ColumnCount = 1
$pasteLayout.Padding = New-Object System.Windows.Forms.Padding(8)
$pasteLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Absolute, 48)))
$pasteLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Percent, 100)))
$pasteLayout.RowStyles.Add((New-Object System.Windows.Forms.RowStyle([System.Windows.Forms.SizeType]::Absolute, 40)))
$tabPaste.Controls.Add($pasteLayout)

$lblPaste = New-Object System.Windows.Forms.Label
$lblPaste.Dock = 'Fill'
$businessHeader = (Get-BusinessColumnNames -Config $script:Config) -join "`t"
$lblPaste.Text = "从 Excel 复制整行/多行后 Ctrl+V 到下方。可含表头。列顺序建议: $businessHeader"
$pasteLayout.Controls.Add($lblPaste, 0, 0)

$txtPaste = New-Object System.Windows.Forms.TextBox
$txtPaste.Multiline = $true
$txtPaste.ScrollBars = 'Both'
$txtPaste.AcceptsTab = $true
$txtPaste.Dock = 'Fill'
$txtPaste.Font = New-Object System.Drawing.Font('Consolas', 9)
$pasteLayout.Controls.Add($txtPaste, 0, 1)

$pasteButtons = New-Object System.Windows.Forms.FlowLayoutPanel
$pasteButtons.Dock = 'Fill'
$pasteButtons.FlowDirection = 'LeftToRight'
$pasteLayout.Controls.Add($pasteButtons, 0, 2)

$btnParsePaste = New-Object System.Windows.Forms.Button
$btnParsePaste.Text = '预览解析'
$btnParsePaste.Width = 100
$pasteButtons.Controls.Add($btnParsePaste)

$btnSubmitPaste = New-Object System.Windows.Forms.Button
$btnSubmitPaste.Text = '提交粘贴数据'
$btnSubmitPaste.Width = 120
$pasteButtons.Controls.Add($btnSubmitPaste)

$btnClearPaste = New-Object System.Windows.Forms.Button
$btnClearPaste.Text = '清空'
$btnClearPaste.Width = 80
$pasteButtons.Controls.Add($btnClearPaste)

# Tab 3: upload
$tabUpload = New-Object System.Windows.Forms.TabPage
$tabUpload.Text = '上传 Excel'
$tabs.TabPages.Add($tabUpload)

$uploadPanel = New-Object System.Windows.Forms.Panel
$uploadPanel.Dock = 'Fill'
$uploadPanel.Padding = New-Object System.Windows.Forms.Padding(10)
$tabUpload.Controls.Add($uploadPanel)

$lblUpload = New-Object System.Windows.Forms.Label
$lblUpload.Text = "选择按模板格式填写的 Excel/CSV。首行应为表头: $((Get-BusinessColumnNames -Config $script:Config) -join ', ')"
$lblUpload.Dock = 'Top'
$lblUpload.Height = 40
$uploadPanel.Controls.Add($lblUpload)

$uploadTool = New-Object System.Windows.Forms.FlowLayoutPanel
$uploadTool.Dock = 'Top'
$uploadTool.Height = 40
$uploadPanel.Controls.Add($uploadTool)

$txtUploadPath = New-Object System.Windows.Forms.TextBox
$txtUploadPath.Width = 520
$txtUploadPath.ReadOnly = $true
$uploadTool.Controls.Add($txtUploadPath)

$btnBrowse = New-Object System.Windows.Forms.Button
$btnBrowse.Text = '浏览...'
$btnBrowse.Width = 80
$uploadTool.Controls.Add($btnBrowse)

$btnPreviewUpload = New-Object System.Windows.Forms.Button
$btnPreviewUpload.Text = '预览'
$btnPreviewUpload.Width = 80
$uploadTool.Controls.Add($btnPreviewUpload)

$btnSubmitUpload = New-Object System.Windows.Forms.Button
$btnSubmitUpload.Text = '提交上传数据'
$btnSubmitUpload.Width = 120
$uploadTool.Controls.Add($btnSubmitUpload)

$lblUploadPreview = New-Object System.Windows.Forms.Label
$lblUploadPreview.Dock = 'Fill'
$lblUploadPreview.TextAlign = 'TopLeft'
$lblUploadPreview.Text = '尚未选择文件'
$uploadPanel.Controls.Add($lblUploadPreview)
$lblUploadPreview.BringToFront()

# ---- Events ----
$btnRefresh.Add_Click({
    try {
        Load-DatabaseIntoGrid -Grid $grid -StatusLabel $status
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnDelete.Add_Click({
    try {
        if ($grid.SelectedRows.Count -eq 0) {
            Show-InfoDialog '请先选中要删除的行'
            return
        }
        $confirm = [System.Windows.Forms.MessageBox]::Show(
            ("确定删除选中的 {0} 行吗？" -f $grid.SelectedRows.Count),
            '确认', 'YesNo', 'Question')
        if ($confirm -ne 'Yes') { return }

        $indexes = @($grid.SelectedRows | ForEach-Object { $_.Index } | Sort-Object -Descending)
        foreach ($i in $indexes) {
            $script:Table.Rows[$i].Delete()
        }
        $script:Table.AcceptChanges()
        Save-DatabaseFromTable -StatusLabel $status
        $grid.DataSource = $null
        $grid.DataSource = $script:Table
        Update-StatusBar -Label $status
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnPurge.Add_Click({
    try {
        $before = $script:Table.Rows.Count
        $records = Convert-DataTableToRecords -Table $script:Table
        $kept = Select-RecordsWithinRetention -Records $records -Config $script:Config
        $script:Table = Convert-RecordsToDataTable -Config $script:Config -Records $kept
        Save-DatabaseFromTable -StatusLabel $status
        $grid.DataSource = $null
        $grid.DataSource = $script:Table
        Update-StatusBar -Label $status
        Show-InfoDialog ("已清理过期数据：{0} -> {1} 条" -f $before, $script:Table.Rows.Count)
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnTemplate.Add_Click({
    try {
        $sfd = New-Object System.Windows.Forms.SaveFileDialog
        $sfd.Filter = 'Excel 工作簿 (*.xlsx)|*.xlsx'
        $sfd.FileName = '导入模板.xlsx'
        $sfd.InitialDirectory = if (Test-Path -LiteralPath ([string]$script:Config.dataFolder)) {
            [string]$script:Config.dataFolder
        } else {
            (Join-Path $root 'templates')
        }
        if ($sfd.ShowDialog() -eq 'OK') {
            Export-ImportTemplate -Config $script:Config -Path $sfd.FileName
            Show-InfoDialog "模板已导出: $($sfd.FileName)"
        }
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnOpenFolder.Add_Click({
    try {
        $folder = Split-Path -Parent $script:DbPath
        if (-not (Test-Path -LiteralPath $folder)) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
        }
        Start-Process explorer.exe -ArgumentList $folder
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnSubmitManual.Add_Click({
    try {
        $raw = @()
        $parts = @()
        foreach ($col in $script:Config.columns) {
            $name = [string]$col.name
            $parts += [string]$inputBoxes[$name].Text
        }
        $raw += , $parts
        # 无表头，按列顺序
        $records = Convert-RawRowsToRecords -Config $script:Config -RawRows $raw
        Add-RecordsToDatabase -Records $records -Grid $grid -StatusLabel $status
        foreach ($key in @($inputBoxes.Keys)) {
            $inputBoxes[$key].Text = ''
        }
        Show-InfoDialog '已提交 1 条记录'
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnParsePaste.Add_Click({
    try {
        $rawRows = Split-ClipboardOrTsvText -Text $txtPaste.Text
        $records = Convert-RawRowsToRecords -Config $script:Config -RawRows $rawRows
        Show-InfoDialog ("解析成功，共 {0} 条。可点击「提交粘贴数据」。" -f $records.Count)
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnSubmitPaste.Add_Click({
    try {
        $rawRows = Split-ClipboardOrTsvText -Text $txtPaste.Text
        $records = Convert-RawRowsToRecords -Config $script:Config -RawRows $rawRows
        Add-RecordsToDatabase -Records $records -Grid $grid -StatusLabel $status
        $txtPaste.Text = ''
        Show-InfoDialog ("已提交 {0} 条记录" -f $records.Count)
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnClearPaste.Add_Click({ $txtPaste.Text = '' })

$btnBrowse.Add_Click({
    $ofd = New-Object System.Windows.Forms.OpenFileDialog
    $ofd.Filter = 'Excel/CSV (*.xlsx;*.xls;*.csv;*.tsv;*.txt)|*.xlsx;*.xls;*.csv;*.tsv;*.txt'
    if ($ofd.ShowDialog() -eq 'OK') {
        $txtUploadPath.Text = $ofd.FileName
        $script:PendingImport = @()
        $lblUploadPreview.Text = "已选择: $($ofd.FileName)`r`n点击「预览」检查数据。"
    }
})

$btnPreviewUpload.Add_Click({
    try {
        if ([string]::IsNullOrWhiteSpace($txtUploadPath.Text)) {
            Show-InfoDialog '请先选择文件'
            return
        }
        $script:PendingImport = @(Import-ExcelFileRows -Config $script:Config -Path $txtUploadPath.Text)
        $previewLines = @("预览成功，共 $($script:PendingImport.Count) 条：")
        $i = 0
        foreach ($rec in $script:PendingImport) {
            if ($i -ge 8) {
                $previewLines += '...（其余省略）'
                break
            }
            $bits = @()
            foreach ($col in $script:Config.columns) {
                $n = [string]$col.name
                $bits += ("{0}={1}" -f $n, $rec.$n)
            }
            $previewLines += ($bits -join ' | ')
            $i++
        }
        $lblUploadPreview.Text = ($previewLines -join "`r`n")
    }
    catch {
        $script:PendingImport = @()
        Show-ErrorDialog $_.Exception.Message
    }
})

$btnSubmitUpload.Add_Click({
    try {
        if (-not $script:PendingImport -or $script:PendingImport.Count -eq 0) {
            if ([string]::IsNullOrWhiteSpace($txtUploadPath.Text)) {
                Show-InfoDialog '请先选择并预览文件'
                return
            }
            $script:PendingImport = @(Import-ExcelFileRows -Config $script:Config -Path $txtUploadPath.Text)
        }
        $n = $script:PendingImport.Count
        Add-RecordsToDatabase -Records $script:PendingImport -Grid $grid -StatusLabel $status
        $script:PendingImport = @()
        $txtUploadPath.Text = ''
        $lblUploadPreview.Text = '提交完成，可继续上传。'
        Show-InfoDialog ("已提交 {0} 条记录" -f $n)
    }
    catch {
        Show-ErrorDialog $_.Exception.Message
    }
})

$form.Add_Shown({
    try {
        if ($script:UsingLocalFallback) {
            Show-InfoDialog ("未检测到 Sharefolder 路径，已临时使用程序目录下 data 文件夹:`r`n$($script:DbPath)`r`n`r`n部署到公司电脑并确保 Y: 盘可用后，将自动写入配置中的 Tool 目录。")
        }
        Load-DatabaseIntoGrid -Grid $grid -StatusLabel $status
    }
    catch {
        Update-StatusBar -Label $status
        Show-ErrorDialog ("加载数据库失败（可先确认本机已安装 Excel）:`r`n" + $_.Exception.Message)
    }
})

[System.Windows.Forms.Application]::EnableVisualStyles()
[void]$form.ShowDialog()
