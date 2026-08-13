---
id: agent-routing
owner: logistics
last_updated: 2026-08-13
status: active
---

# 问题路由表

回答前：先读 `agent/AGENT.md`，再按问题类型打开下表文件。  
`*` = 强烈建议；其余按问题深度选用。

| 问题类型 | 必读 | 常选用 |
|---|---|---|
| 公司/职责边界 | `knowledge/01-company/*` | — |
| 产品能不能运/怎么运 | `knowledge/02-products/*` | `07-compliance/*` |
| 仓网/流向/选址 | `knowledge/03-network/*` | `05-strategy/*`, `06-performance/*` |
| 承运商/流程/SLA | `knowledge/04-operations/*` | `06-performance/*`, `projects/*` |
| 战略方向/年度重点 | `knowledge/05-strategy/*` | `06-performance/*`, `03-network/*` |
| 成本/KPI/降本 | `knowledge/06-performance/*` | `04-operations/*`, `05-strategy/*` |
| 危化品/海关/法规 | `knowledge/07-compliance/*` | `02-products/*`, `04-operations/*` |
| **GHS 象形图含义 / vs 运输标签 / 副危 / 分类鉴定** | `ghs-pictograms.md` + `ghs-tdg-mapping.md` + Skill `dg-ghs-tdg-labeling` | `02-products/*` |
| 系统/数据能否支撑 | `knowledge/08-systems/*`（含 **Notion MK数据库直连**） | 相关业务目录 |
| 分析方法/升级路径 | `knowledge/09-playbooks/*` | 对应主题目录 |
| 某在建项目 | `projects/<匹配文件>` | 相关 knowledge |
| 复盘历史决策 | `decisions/*` | 相关 knowledge / projects |
| **用户说数据在 Notion / MK数据库 / 新 CSV** | **先 fetch MK数据库页** → 查子库（见 `08-systems/notion-data-drop.md`） | 再写入 `06-performance/` |

## Notion 直连（固定入口）

- 页面：**MK数据库**  
- URL：https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de  
- 行为：fetch 页内 Database → SQL 分析；CSV 须为 **Import 成库**，不是附件。

## 组合问题

例如“嘉兴出口欧洲降本且不伤 OTIF”：

1. `05-strategy`（目标与约束）  
2. `03-network` + `04-operations`（路径与承运）  
3. `02-products` + `07-compliance`（危化品限制）  
4. `06-performance`（成本与服务基线）  
5. 相关 `projects/`

## 信息缺口话术

当关键文件仍为 `status: draft` 或内容为空时：

> 当前结论基于已有文件；缺少 `knowledge/<path>` 中的 [具体字段]。请补充后可收紧建议。
