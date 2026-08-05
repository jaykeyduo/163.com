---
id: notion-data-drop
owner: logistics
last_updated: 2026-08-05
status: active
---

# Notion 业务数据直连（MK数据库）

## 主入口（固定）

| 项 | 值 |
|---|---|
| 页面名称 | **MK数据库** |
| URL | https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de |
| 用途 | 用户后续投放的 **CSV 导入型 Database** 统一存放处 |
| 读取方式 | Notion MCP：`notion-fetch` 该页 → 发现子 Database → `notion-query-data-sources` SQL 分析 |

## Agent 强制行为

当用户说「新数据在 Notion / 看 MK数据库 / 同步 CSV / 分析最新表」或涉及绩效/温控/运输量等需最新业务数时：

1. **先 fetch** `https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de`  
2. 列出页内所有 `<database ...>` 子库  
3. 对目标库 fetch schema + SQL/view 查询  
4. 将结论写入 `knowledge/06-performance/`（或对应主题），并按需更新 Excel `deliverables/`  
5. **不要**要求用户再粘贴已放在 MK数据库中的表（除非 MCP 额度用尽或附件不可读）

## 可读 vs 不可读

| 投放方式 | Agent 能否直连分析 |
|---|---|
| CSV **Import 成 Notion Database**（推荐） | **能** — SQL 查询行级数据 |
| 页面粘贴表格 | 能（经 fetch 页面内容） |
| 仅上传 **xlsx/csv 附件**（不导入成库） | **不能**完整解析 — 需改为 Import |

## 用户投放 SOP（请保持）

1. 打开 **MK数据库** 页  
2. 将 CSV **导入为 Database**（或 Merge with CSV），子库标题用清晰文件名，如 `2026WHWorkload.csv`  
3. 在对话说：`MK数据库已更新：<子库名>`  
4. Agent 自动 fetch 并分析  

## 已登记子库

| 子库标题 | data-source | 说明 | 分析落点 |
|---|---|---|---|
| 2025TCTRansport.csv | `collection://3b36f5d1-2cd6-80b8-ab4b-000b12c71317` | 温控运输（约 2025 Q4） | `knowledge/06-performance/tc-transport-2025-analysis.md`；Excel 仪表盘 |

> 新子库出现后，Agent 应更新本表。

## 额度注意

Notion `query_data_sources` 可能有 workspace 用量限制。额度耗尽时：说明限制，改用已缓存的 knowledge 汇总，或请用户稍后重试 / 导出关键聚合后再贴。
