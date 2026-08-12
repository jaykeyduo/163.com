---
id: export-packaging-un
owner: logistics
last_updated: 2026-08-12
status: active
source:
  - Notion MK数据库 image: 出口流程图Export+Process_ByRoy.jpg (2026-08-12)
  - Email: Phase I (2026-07-29) + Phase II minutes (Jason Jiang)
---

# 出口 UN 包装 / 流程分析与修订建议

## 1. 总结（给管理层）

已基于 Notion **MK数据库** 内嵌图片 `出口流程图Export+Process_ByRoy.jpg` 完整识读 **ByRoy 现图（As-Is）**。现图是可用的 **申请→包装准备→生产→报关出运** 泳道主干，但与 Phase I/II 纪要相比，**主数据门禁（S1/S2/S3）、罐装现场 UN 指导、年切换隔离/报废、相容性/危包证、精确生产日** 仍未写入图中。

**建议：** 保留 ByRoy 四阶段骨架与「首出口测试」「出口桶/罐码与内贸区分」等已有节点；用修订版补齐纪要缺口，作为正式 Export+Process 主干。冲突规则：**与 Phase I 冲突以 Phase II 为准；无冲突继续沿用 Phase I。**

---

## 2. ByRoy 现图 As-Is（2026-08-12 识读）

**源文件：** `deliverables/source/ExportProcess_ByRoy.jpg`  
**Notion：** [MK数据库](https://app.notion.com/p/3b36f5d12cd680f59f17c30047a9f8de) 内嵌图  
**标题：** Export Process Procedure  

### 2.1 泳道（左→右）

| # | 泳道 |
|---|---|
| 1 | Project Coordinator |
| 2 | Procurement |
| 3 | Production & QC |
| 4 | Customer Lab |
| 5 | Order Clearing |
| 6 | Material Planning |
| 7 | Logistic |

### 2.2 阶段与节点（按图）

#### Phase I — Requirement Clarification（Application）

| 泳道 | 节点 / 交付物 |
|---|---|
| PC | **Request** → **Define the product (10 Digit)** → 文档 **Export Request Sheet (Product + Package)** |
| Procurement | **Provide the UN requirements** → 文档 **UN Package requirements input**；**Advise Export Package**（输入来自 Export Request Sheet + **Standard toolbox**） |
| Customer Lab | 按 UN 包装要求提供 **composition / viscosity / density** 等 → 对应文档 |
| Order Clearing | **Provide SDS, Label info** → **SDS, Label doc** |

#### Phase II — Package Preparation

| 节点 | 说明 |
|---|---|
| **Check if meet requirements**（菱形） | Yes / No 分支 |
| No | **New Package Assessment (Not recommend)** → 回到 / 关联 **Standard toolbox for Export package**、**Stock for Export** |
| Yes | **Confirm in the Export Request Sheet** |
| 规则注记 | **Export bucket code should be different from domestic** |
| Customer Lab | **Apply 13 Digit of Product** |
| Material Planning | **Prepare for Filling Order**；注记 **Export tin code should be separate distinction** |

#### Phase III — Production

| 泳道 | 节点 |
|---|---|
| PC | **Confirm the demand, Sales Order** |
| Material Planning | **Production Order & Filling Order** |
| Production & QC | **Production Complete with export package** → **QC result OK** |
| Logistic | **Storage** |
| 规则注记 | 再次强调出口桶码 ≠ 内贸桶码 |

#### Phase IV — Customs Inspection

| 泳道 | 节点 |
|---|---|
| Logistic | **Order customs inspection** → 菱形 **1st time?** |
|  | Yes → **1st time export test process**；No → 直通 |
|  | **Shipping Label Labelling** → **Export Inspection** → **Delivery & Vessel Booking** |
| PC | **END** |

### 2.3 现图已覆盖的价值点（应保留）

1. 早期锁定 **UN package requirements** + 产品物性（粘度/密度等）  
2. **Export Request Sheet** 作为申请载体  
3. **Standard toolbox** 作为标准包装工具箱（接近 S2 思想）  
4. **新包装评估默认不推荐**  
5. **出口桶/罐码与内贸区分**（13 位 / tin code）  
6. **首出口测试** 分支（在出运阶段）  
7. 生产完成 → QC → 入库 → 报关 → 贴标 → 查验 → 订舱交货 的出运链  

---

## 3. 相对 Phase I/II 纪要的缺口清单

| # | 纪要要求 | ByRoy 现图 | 建议修改 |
|---|---|---|---|
| 1 | **S1** 出口包装申请表（业务填；Francis 补采购字段） | 有 Export Request Sheet，未命名 S1、未规定字段门禁 | 将 Export Request Sheet **正式映射为 S1**，补必填字段 |
| 2 | **S2** 出口包装选项（采购维护；一料号一条；培训 Sales+PC） | 有 Standard toolbox，未写维护责任/唯一性/培训 | 明确 toolbox = S2；采购主数据维护泳道 |
| 3 | **S3** 包装及性能单信息汇总（采购；独山抬头；自然年；4 位编码↔桶形 1:1） | 无 | 采购维护 S3；申请/切换必读 |
| 4 | 出口部判定 **该国首次出口** → 叠加海关检测 **Lead-time** 进计划 Milestone | 有 Logistic **1st time export test**（偏出运末段） | 前移：出口部在申请/排产前判定；保留末段测试节点并改名对齐 |
| 5 | 罐装单 **备注 UN 号**，现场按单取桶 | 仅写 Production Complete with export package | Production 节点写明「按罐装单 UN 取桶/核对」 |
| 6 | 新老 UN **年切换**：采购邮件通知；大口物理隔离→**3 号仓**；小口到货通知生产报废 | 无 | 增加并行「年度切换」子流程 |
| 7 | 供应商到货贴 **UN+年份** | 无 | 写入仓收货核对节点 |
| 8 | 危包证 / **产品-包装相容性自检**（实验室或第三方，一次性） | Customer Lab 仅物性数据，无相容性/危包证 | 合规并行：按需触发相容性 |
| 9 | SAP **生产日期精确到日**（海关） | 无 | QC/出运单证节点写入 |
| 10 | 泳道含 **业务/Sales、出口报关、仓库** 责任清晰 | 无独立 Export 部门；Customer Lab 易误解为客户实验室；仓与报关都挤在 Logistic | 改中文责任：业务/PC、采购、出口、计划、生产&QC、仓库、实验室/第三方 |
| 11 | Phase 边界：需求&包装锁定 → 备料生产 → 出运 | 四阶段可用，但 Phase I/II 与纪要命名不完全一致 | 保留四阶段，节点按上表补齐 |

---

## 4. 纪要原则蒸馏（修订版必须遵守）

### 表与主数据

| 代号 | 名称 | 谁维护/填写 | 与 ByRoy 映射 |
|---|---|---|---|
| S1 | 出口包装申请表 | **业务填**；Francis 补采购字段 | ≈ Export Request Sheet |
| S2 | 出口包装选项 | **采购维护**；培训 Sales+PC | ≈ Standard toolbox |
| S3 | 包装及性能单信息汇总 | **采购维护** | **现图缺失，必须新增** |

### 性能单 / UN

- 未来新项目性能单、出口抬头：**独山工厂**  
- 每种出口桶 **一对一 4 位编码**（禁止一码两桶形）  
- 性能单按 **自然年** 申请  
- 新老 UN 切换：采购 **邮件通知** 计划/生产/物流；年底切换专题会  

### 仓库物理

- 供应商到货贴 **UN+年份**  
- 大口：新旧盖 **物理隔离**，新盖进 **3 号仓**  
- 小口：新 UN 到货 → 仓邮件通知生产 → 生产报废旧小口库存  

### 生产 / 合规

- 罐装单 **已备注 UN 号** → 现场按单用桶  
- 海关要 **精确到日** 的生产日期（SAP）  
- 危包证需 **相容性自检**（实验室/第三方）  

---

## 5. 修订版流程图

见同目录：

- `export-process-revised.md` — 可读摘要  
- `export-process-revised.mmd` — Mermaid 源（含年度切换子流程）  
- `deliverables/出口UN包装流程_修订版.svg` — 交付图  

逻辑摘要：

```text
业务需求 → 查S2(toolbox)选包装 → 填S1(Export Request Sheet)
    → 出口部：是否该国首出口？→（是）加海关检测Lead-time
    → 采购：核对S3/性能单/料号唯一性 → 必要时年申请/补购包装
    → 计划排产（含Lead-time）→ 仓收UN包装（贴标/隔离规则）
    → 生产按罐装单UN号罐装 + QC（生产日精确到日）
    → [按需] 相容性/危包证
    → 仓出库 → 首出口测试(若适用) → 贴标/查验/订舱出运
```

---

## 6. 改图优先级

1. **P0**：S1/S2/S3 命名与门禁；首出口 Lead-time 前移；罐装按 UN  
2. **P1**：年切换隔离子流程；采购通知邮件  
3. **P2**：相容性/危包证；纸箱性能单（Phase I 未闭环）  
4. **P3**：Jason 出口 Lead-time 天数回写 Milestone  

---

## 7. 待确认（不阻塞出修订图）

- Francis：S1 相对现 Export Request Sheet 还需哪些采购字段；性能单未用完影响  
- Jason：出口 Lead-time 影响哪些 Milestone（天数）；与图中「1st time export test」是否同一动作  
- 纸箱无编号追溯流程（Phase I 未定）  
- PDF 性能单查看权限  
- Customer Lab 是否实为内部实验室/TAC（建议图上改名避免误解）  
