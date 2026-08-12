---
id: export-process-revised
owner: logistics
last_updated: 2026-08-12
status: active
---

# 出口流程修订版（对齐 Phase I / II）

## 结论

Notion `Export+Process_ByRoy` **现图不可用为执行版**（几乎只有泳道表头）。下图按会议纪要重建，建议作为 **Export+Process 正式主干**；Lead-time 天数待 Jason 分析后回填。

## 责任泳道（建议替换原英文列）

| 泳道 | 职责要点 |
|---|---|
| 业务 / PC | 查 S2、填 S1、接受培训 |
| 采购 | 维 S2/S3、性能单与包装采购、UN 切换通知 |
| 出口部 | 首出口判定、海关 Lead-time、报关出运 |
| 计划 MP | 排产 Milestone（含 Lead-time） |
| 生产 & QC | 按罐装单 UN 罐装；生产日进 SAP |
| 仓库物流 | UN 包装收货、隔离/报废协同、出库 |
| 实验室/第三方 | 相容性自检（按需） |

## 流程图

```mermaid
flowchart TB
  subgraph P0["Phase 0 主数据（采购常驻维护）"]
    S2["S2 出口包装选项<br/>采购维护｜一料号一条记录"]
    S3["S3 包装及性能单信息汇总<br/>独山抬头｜自然年｜编码↔桶形1:1"]
  end

  subgraph P1["Phase 1 需求与包装锁定"]
    A1["业务/PC：提出出口需求"]
    A2["查阅 S2 选择包装"]
    A3["填写 S1 出口包装申请表"]
    A4{"出口部：该国首次出口？"}
    A5["叠加海关检测 Lead-time"]
    A6["常规 Lead-time"]
    A7["采购核 S3 / 料号唯一 / 库存"]
    A8{"性能单与包装足够？"}
    A9["采购补申请/下单<br/>到货贴 UN+年份"]
    A10["包装锁定 → 通知计划/生产/物流"]
  end

  subgraph P2["Phase 2 计划与仓备料"]
    B1["计划排产（含 Lead-time Milestone）"]
    B2["仓收 UN 包装并核对"]
    B3{"大口盖年切换？"}
    B4["新旧盖隔离 · 新盖→3号仓"]
    B5{"小口新 UN 到货？"}
    B6["通知生产报废旧小口库存"]
    B7["可供产"]
  end

  subgraph P3["Phase 3 罐装与合规"]
    C1["生产按罐装单 UN 号用桶"]
    C2["QC · SAP 生产日期精确到日"]
    C3{"需危包证/相容性？"}
    C4["实验室/第三方相容性自检"]
    C5["合规齐套"]
  end

  subgraph P4["Phase 4 出运"]
    D1["仓出库"]
    D2["出口报关出运"]
    D3["回写包装消耗"]
  end

  S2 --> A2
  S3 --> A7
  A1 --> A2 --> A3 --> A4
  A4 -->|是| A5 --> A7
  A4 -->|否| A6 --> A7
  A7 --> A8
  A8 -->|否| A9 --> A10
  A8 -->|是| A10
  A10 --> B1 --> B2 --> B3
  B3 -->|是| B4 --> B5
  B3 -->|否| B5
  B5 -->|是| B6 --> B7
  B5 -->|否| B7
  B7 --> C1 --> C2 --> C3
  C3 -->|是| C4 --> C5
  C3 -->|否| C5
  C5 --> D1 --> D2 --> D3
```

## 相对 ByRoy 现图的关键增补

1. S1 门禁 + S2/S3 主数据  
2. 首出口 Lead-time 分支  
3. 罐装单 UN 指导现场  
4. 年切换隔离/报废（可画并行子流程，见 `export-process-revised.mmd`）  
5. 相容性与精确生产日  

## 源文件

- 详细问题与纪要：`export-packaging-un.md`  
- Mermaid 源：`export-process-revised.mmd`  
