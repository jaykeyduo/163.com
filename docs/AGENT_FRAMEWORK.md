# Logistics Advisor Agent — 设计框架

## 1. 目标

建设一个**可维护、可演进**的物流战略顾问 Agent：

- 为物流战略、网络、项目、成本与合规提供建议
- 背景知识与 Agent 行为分离：改文件即可更新认知
- 建议可追溯：重要结论归档到 `decisions/`

本框架先于业务文件落地。业务内容后续填入 `knowledge/` 占位文件即可。

---

## 2. 四层架构

```text
┌─────────────────────────────────────────────┐
│  Interface（对话入口）                         │
│  用户提问 → Cursor Agent / 规则触发            │
├─────────────────────────────────────────────┤
│  Runtime（运行层）  agent/                     │
│  角色 · 原则 · 路由 · 输出模板                  │
├─────────────────────────────────────────────┤
│  Knowledge（知识层）  knowledge/               │
│  公司 · 产品 · 网络 · 运营 · 战略 · KPI · 合规   │
├─────────────────────────────────────────────┤
│  Work Memory（工作记忆）                        │
│  projects/ 在建项目 · decisions/ 决策归档       │
└─────────────────────────────────────────────┘
```

### 2.1 Runtime — `agent/`（少改）

定义 Agent **是谁、怎么想、怎么答**。不存放易变业务数字。

| 文件 | 职责 |
|---|---|
| `AGENT.md` | 角色、边界、决策原则、禁止事项 |
| `ROUTING.md` | 问题类型 → 必读知识文件映射 |
| `OUTPUT_TEMPLATES.md` | 战略建议、项目评估等标准输出结构 |

### 2.2 Knowledge — `knowledge/`（主维护区）

存放**事实与约束**。编号目录便于排序与引用。

| 目录 | 内容 | 建议更新频率 |
|---|---|---|
| `01-company/` | 公司、组织、市场边界 | 组织变更时 |
| `02-products/` | 产品、包装、危化品运输约束 | 品类/法规变更时 |
| `03-network/` | 工厂、仓、港、客户区域、流向 | 网络调整时 |
| `04-operations/` | 承运商、流程、Incoterms、SLA | 季度或合同变更时 |
| `05-strategy/` | 战略目标、痛点、优先级 | 季度战略会后 |
| `06-performance/` | 成本结构、KPI、趋势 | 月度 |
| `07-compliance/` | 危化品、海关、REACH 等 | 法规/审计时 |
| `08-systems/` | ERP/WMS/TMS、数据可用性 | 系统上线时 |
| `09-playbooks/` | 标准分析方法与 escalation | 方法论迭代时 |

**规则：业务事实只写在 knowledge，不写进 AGENT.md。**

### 2.3 Work Memory — `projects/` + `decisions/`

| 目录 | 性质 | 写法 |
|---|---|---|
| `projects/` | 进行中的物流项目 | 一项目一文件，可改状态 |
| `decisions/` | 已形成的建议/拍板 | 追加为主，不覆写历史 |

---

## 3. 单一事实源（SSOT）

```text
用户发现新信息
    → 写入 knowledge/ 或 projects/ 对应文件
    → 下次对话 Agent 自动读到新版本
    → 无需“重新训练”或重写 prompt
```

禁止：

- 把关键 KPI、网络点、承运商名单只留在聊天记录里
- 在多个文件重复粘贴同一数字（应一处维护，别处引用路径）
- 用 `AGENT.md` 堆业务细节

允许：

- `AGENT.md` 写原则：“优先 OTIF，再谈降本”
- `knowledge/05-strategy/` 写具体目标：“2026 OTIF ≥ 95%”

---

## 4. 文件命名与状态约定

### 4.1 知识文件

```text
knowledge/<nn-topic>/<topic>-overview.md     # 该主题总览（必填）
knowledge/<nn-topic>/<specific-name>.md      # 专题补充
```

每个子目录含 `README.md`：说明本目录用途、应放什么、更新责任人（可后填）。

### 4.2 项目文件

```text
projects/YYYY-MM-<short-name>.md
```

状态字段：`proposed | active | on-hold | done | cancelled`

### 4.3 决策文件

```text
decisions/YYYY-MM-DD-<short-name>.md
```

含：背景、选项、建议、风险、待确认项、决策结果（若已拍板）。

### 4.4 文档头（推荐）

每个知识/项目文件顶部使用：

```yaml
---
id: network-overview
owner: logistics
last_updated: 2026-08-04
status: draft   # draft | active | deprecated
---
```

---

## 5. Agent 推理闭环

```text
1. 理解问题类型（战略 / 项目 / 运营 / 合规 / 成本）
2. 按 ROUTING.md 打开对应 knowledge + 相关 projects
3. 标注信息来源与缺口（缺失则明确“需补充哪份文件”）
4. 按 OUTPUT_TEMPLATES.md 输出备选方案与建议
5. 若形成重要建议 → 提示写入 decisions/
6. 若发现事实变更 → 提示用户更新 knowledge/ 某文件
```

Agent **不假装知道**未写入知识库的事实；应指出缺口文件路径。

---

## 6. 维护工作流

### 6.1 日常改背景

1. 定位主题 → 打开 `knowledge/0x-*/`  
2. 编辑对应 `.md`  
3. 更新 `last_updated`  
4. （可选）在 PR/commit message 写明影响范围  

### 6.2 季度战略刷新

重点更新：

- `knowledge/05-strategy/`
- `knowledge/06-performance/`
- 活跃 `projects/`

### 6.3 Agent 行为微调

仅当角色、原则、输出结构变化时改 `agent/`。

---

## 7. 权限与敏感信息（预留）

| 级别 | 示例 | 存放建议 |
|---|---|---|
| L1 可共享 | 网络示意、公开流程 | `knowledge/` 正文 |
| L2 内部 | KPI、成本区间、承运商评分 | `knowledge/`；勿外传 |
| L3 机密 | 合同单价、未披露并购 | 脱敏摘要入 knowledge；明细放受控位置并在 overview 中注明“详情另存” |

当前框架默认全部为内部仓库文件；后续可加 `knowledge/_private/` 或外链策略。

---

## 8. 与 Cursor 的衔接

- `.cursor/rules/logistics-advisor.mdc`：每次对话加载角色与路由规则
- Agent 被要求：**先读路由，再读知识，再回答**
- 用户补充材料时：落入正确 `knowledge/` 子目录，而不是塞进规则文件

---

## 9. 落地顺序（不含业务填充时间）

| 阶段 | 交付 |
|---|---|
| P0 本阶段 | 本框架 + 空知识骨架 + Agent 运行文件 |
| P1 | 填入最小可行知识包（公司/网络/战略/产品约束/KPI） |
| P2 | 导入在建项目 + 首批 decision 模板试跑 |
| P3 | 按真实问答校准 ROUTING 与输出模板 |

---

## 10. 非目标（本阶段不做）

- 不接 ERP/TMS 实时 API（仅预留 `08-systems/` 说明）
- 不做自动下单或承运商切换执行
- 不替代法务/危化品正式合规签核（Agent 只给物流视角建议并提示升级）
