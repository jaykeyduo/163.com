---
id: export-process-revised
owner: logistics
last_updated: 2026-08-12
status: active
---

# 出口流程修订版（ByRoy 现图 + Phase I/II）

## 结论

已识读 Notion 图 `Export+Process_ByRoy.jpg`：**四阶段主干可用**。修订版补齐 S1/S2/S3、罐装 UN、年切换、相容性/精确生产日。  

**Jason 确认（2026-08-12）：** 图中「1st time export test」与纪要「首出口 Lead-time」为**同一动作**——申请/排产时只做「是否首出口」判定并预留 Milestone；**执行**仍用 Phase IV 该节点，勿拆成两套流程。Lead-time **天数**待 Jason 回填。

**Initiate 跨部门检查（v1）：** 业务提出出口后、排产前，由**出口部门**按部门勾选，见 `export-initiate-checklist.md` 与 `deliverables/出口Initiate跨部门Checklist.xlsx`。时限与首出口天数待整厂出口流程图补入。

## 责任泳道（建议）

| 泳道 | 对应 ByRoy 列 | 职责要点 |
|---|---|---|
| 业务 / PC | Project Coordinator | 查 S2、填 S1、确认 SO、接受培训 |
| 采购 | Procurement | 维 S2/S3、UN 要求、toolbox、新包装评估（默认不推荐） |
| 出口部 | （现图并入 Logistic） | 首出口判定、执行首出口检测、报关出运 |
| 计划 MP | Material Planning | 排产 / Filling Order（首出口则 Milestone 含 Lead-time） |
| 生产 & QC | Production & QC | 按罐装单 UN 罐装；生产日进 SAP |
| 仓库物流 | Logistic（仓段） | UN 包装收货、隔离/报废、出库贴标协同 |
| 实验室/第三方 | Customer Lab（建议改名） | 物性数据；按需相容性自检 |
| Order Clearing | Order Clearing | SDS / Label 资料 |

## 相对 ByRoy 现图的关键增补

1. 显式 **S1/S2/S3**（Request Sheet≈S1，toolbox≈S2，S3 新增）  
2. 首出口：**同一动作**——早判定进 Milestone + Phase IV 执行「1st time export test」  
3. 罐装单 **UN 号** 指导现场  
4. **年切换** 隔离/报废子流程  
5. 相容性/危包证 + **精确生产日**  

## 流程图

```mermaid
flowchart TB
  subgraph P0["Phase 0 主数据（采购常驻）"]
    S2["S2 / Standard toolbox<br/>采购维护｜一料号一条"]
    S3["S3 性能单信息汇总<br/>独山抬头｜自然年｜编码↔桶形1:1"]
  end

  subgraph P1["Phase 1 需求澄清（保留 ByRoy）"]
    A1["PC：Request"]
    A2["定义产品 10 位码"]
    A3["填 S1 = Export Request Sheet<br/>Product + Package"]
    A4["采购：提供 UN requirements"]
    A5["实验室：粘度/密度/组成等"]
    A6["Order Clearing：SDS / Label"]
    A7["采购：Advise Export Package<br/>读 S2 toolbox"]
    A8{"Check if meet requirements?"}
    A9["New Package Assessment<br/>默认 Not recommend"]
    A10["Confirm Export Request Sheet<br/>出口桶码 ≠ 内贸"]
    A11{"出口部：该国首次出口？"}
    A12["标记首出口<br/>计划 Milestone 预留 Lead-time"]
    A13["常规交期（无额外首出口缓冲）"]
    A14["采购核 S3 / 库存 / 料号唯一"]
    A15{"性能单与包装足够？"}
    A16["补申请/下单｜到货贴 UN+年份"]
    A17["包装锁定 → 通知计划/生产/物流"]
    A18["实验室：Apply 13 Digit"]
  end

  subgraph P2["Phase 2 计划与仓备料"]
    B1["MP：Prepare Filling Order<br/>出口 tin code 单独区分"]
    B2["MP：排产（含已标记的首出口 Lead-time）"]
    B3["仓收 UN 包装并核对"]
    B4{"大口盖年切换？"}
    B5["新旧盖隔离 · 新盖→3号仓"]
    B6{"小口新 UN 到货？"}
    B7["通知生产报废旧小口库存"]
    B8["可供产"]
  end

  subgraph P3["Phase 3 生产"]
    C1["PC：Confirm demand / Sales Order"]
    C2["MP：Production Order & Filling Order"]
    C3["生产：按罐装单 UN 号用桶罐装"]
    C4["QC OK｜SAP 生产日期精确到日"]
    C5{"需危包证/相容性？"}
    C6["实验室/第三方相容性自检"]
    C7["仓：Storage"]
  end

  subgraph P4["Phase 4 报关出运"]
    D1["Order customs inspection"]
    D2{"本票已标记首出口？"}
    D3["执行 1st time export test<br/>= 纪要首出口 Lead-time 同一动作"]
    D4["Shipping Label Labelling"]
    D5["Export Inspection"]
    D6["Delivery & Vessel Booking"]
    D7["END"]
  end

  S2 --> A7
  S3 --> A14
  A1 --> A2 --> A3
  A3 --> A4 --> A5 --> A6
  A3 --> A7 --> A8
  A8 -->|No| A9 --> A7
  A8 -->|Yes| A10 --> A11
  A11 -->|是| A12 --> A14
  A11 -->|否| A13 --> A14
  A14 --> A15
  A15 -->|否| A16 --> A17
  A15 -->|是| A17
  A17 --> A18 --> B1 --> B2 --> B3 --> B4
  B4 -->|是| B5 --> B6
  B4 -->|否| B6
  B6 -->|是| B7 --> B8
  B6 -->|否| B8
  B8 --> C1 --> C2 --> C3 --> C4 --> C5
  C5 -->|是| C6 --> C7
  C5 -->|否| C7
  C7 --> D1 --> D2
  D2 -->|Yes| D3 --> D4
  D2 -->|No| D4
  D4 --> D5 --> D6 --> D7
```

## 源文件

- 现图审计：`export-packaging-un.md`  
- 原图副本：`deliverables/source/ExportProcess_ByRoy.jpg`  
- Mermaid：`export-process-revised.mmd`  
- SVG：`deliverables/出口UN包装流程_修订版.svg`  
