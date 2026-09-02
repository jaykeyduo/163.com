# 物流单证周数据库（带 UI）

PowerShell 5.1 + WinForms + Excel，无需安装额外软件。

## 如何拿到真正的 ZIP（不要「另存为网页」）

Cursor Artifacts / 对话页点「另存为」常会变成「网页，全部」——那是在保存网页，不是软件包。

请用下面任一方式：

1. **GitHub 直接下载 ZIP（推荐）**  
   打开并下载（右键另存为应显示 `.zip`）：  
   https://github.com/jaykeyduo/163.com/raw/cursor/cs-weekly-excel-db-ui-4391/dist/LogisticsWeeklyDbTool.zip

2. **克隆/拉取仓库**后进入 `客服单证周数据库` 文件夹

拿到文件夹后，在公司电脑双击 `Deploy-To-Desktop.bat`，会复制到：

`C:\Users\jason.jiang\桌面\Tool`  
（若只有英文 Desktop，则自动用 `C:\Users\jason.jiang\Desktop\Tool`）

然后双击该目录下的 `Start.bat`。

## 功能

- 手工录入（可 Ctrl+V）
- Excel 整行/多行粘贴提交
- 上传 Excel/CSV 提交
- 写入同目录 `WeeklyDatabase.xlsx`
- 上限约 1000 条，保留约 7 天

## 默认字段

日期*、单号*、客户、业务类型、内容摘要、状态、备注；自动追加录入时间、录入人。可改 `config.json`。
