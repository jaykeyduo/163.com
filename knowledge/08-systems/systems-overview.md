---
id: systems-overview
owner: logistics
last_updated: 2026-08-05
status: active
---

# 系统与数据可用性

## 系统清单

| 系统 | 用途 | 主数据 | 物流相关模块 |
|---|---|---|---|
| ERP (SAP) | 业务主系统 | 待补 | 培训/理解列为战略痛点 |
| WMS | 待补 | | |
| TMS | 待补 | | |
| **Notion · MK数据库** | **Agent 业务 CSV 直连入口** | 导入型 Database | 见 `notion-data-drop.md` |

## Agent 当前可依赖的数据

| 数据类型 | 是否可用 | 粒度 | 更新频率 | 可信度备注 |
|---|---|---|---|---|
| 温控运输 2025 Q4 | 是 | 物料行 / Delivery | 用户投放 | Notion 子库 `2025TCTRansport.csv` |
| 仓周工作量 2026 | 是 | 周 | 用户粘贴/截图入库 | `wh-workload-2026-weekly.*` |
| 订单 / 实时库存 | 否 | — | — | 待接 SAP 或新 CSV |
| 成本全量 | 部分 | 温控运费（Delivery 去重） | 随 CSV | 其他成本待补 |

## 明确不可用 / 需人工提供

- Notion **附件型** xlsx（未 Import 成 Database）— MCP 无法行级解析  
- SAP 实时接口 — 未接通  

## 直连入口

**一律优先：** https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de （MK数据库）  
细则：`notion-data-drop.md`
