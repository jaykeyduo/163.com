---
id: playbook-notion-csv-ingest
owner: logistics
last_updated: 2026-08-05
status: active
---

# Playbook：从 MK数据库 摄入新 CSV

## 触发

用户说：MK数据库已更新 / 新 CSV / 分析 Notion 某表

## 步骤

1. `notion-fetch` → https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de  
2. 识别新增或指定的 `<database>`  
3. `notion-fetch` 该 database → 取 `collection://...` 与字段  
4. `notion-query-data-sources` SQL：总量、维度 Top、必要去重规则（如运费按 Delivery）  
5. 写/更新 `knowledge/06-performance/<name>-analysis.md`  
6. 更新 `08-systems/notion-data-drop.md` 已登记子库表  
7. 若用户要仪表盘 → 生成/刷新 `deliverables/*.xlsx`  

## 失败处理

| 情况 | 动作 |
|---|---|
| 只有附件无 Database | 提示改为 Import CSV 成库 |
| query 额度用尽 | 告知稍后重试；用已有 knowledge 缓存 |
| 字段名不清 | fetch schema 后请用户确认关键列含义 |
