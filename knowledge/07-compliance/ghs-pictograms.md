---
id: ghs-pictograms
owner: logistics
last_updated: 2026-08-13
status: active
source:
  - User attachment: 象形符号和危险品标志
  - Cross-check: https://www.chemicalbook.com/ghs_cn.htm（与附件一致）
  - UN GHS（教学核对）
related:
  - knowledge/07-compliance/ghs-tdg-mapping.md
  - .cursor/skills/dg-ghs-tdg-labeling/SKILL.md
---

# GHS 象形符号 ↔ 危险种类/类别（危货物流用）

## 1. 核对结论

| 判断 | 说明 |
|---|---|
| **附件整体正确** | 与 UN GHS / ChemicalBook 公开对照一致，可作培训与识读 SDS 第 2 章用 |
| **一处补全** | **GHS03（圆圈火焰）** 除氧化性气体、氧化性液体外，正式 GHS 还包括 **氧化性固体 类别 1/2/3**（源站表偶有漏列） |
| **用途边界** | 本表是 **GHS 货架/SDS 象形图** 识读，**不是** TDG 运输标对照；运输标见 `ghs-tdg-mapping.md` |

### 仓配必记

**GHS05 腐蚀象形图** 对应三类危害之一即可出现：

1. 金属腐蚀 类别 1  
2. 皮肤腐蚀 1A / 1B / 1C  
3. **严重眼损伤 类别 1**  

其中第 3 类 ** alone 不构成 TDG 第 8 类** → 不能因看见腐蚀图就贴运输 8 类标。

---

## 2. 九种 GHS 象形图总表

| 代码 | 中文名 | 英文 | 危险种类和类别（GHS） | 物流备注 |
|---|---|---|---|---|
| **GHS01** | 爆炸炸弹 | Exploding Bomb | 不稳定爆炸物；爆炸物 1.1–1.4；自反应 A、B；有机过氧化物 A、B | 与 GHS02 可同时出现（如 Type B） |
| **GHS02** | 火焰 | Flame | 易燃气体 Cat.1；易燃气溶胶 1–2；易燃液体 1–3；易燃固体 1–2；自反应 B–F；自燃液/固 Cat.1；自热 1–2；遇水放易燃气体 1–3；有机过氧化物 B–F | 涂料最常见 GHS 图之一 |
| **GHS03** | 圆圈上的火焰 | Flame over circle | 氧化性气体 Cat.1；氧化性液体 1–3；**氧化性固体 1–3（补全）** | |
| **GHS04** | 气体钢瓶 | Gas cylinder | 压力下气体：压缩 / 液化 / 冷冻液化 / 溶解气体 | |
| **GHS05** | 腐蚀 | Corrosion | 金属腐蚀 Cat.1；皮肤腐蚀 1A–1C；**严重眼损伤 Cat.1** | 易与 TDG 第 8 类混淆 |
| **GHS06** | 骷髅与交叉骨 | Skull and crossbones | 急性毒性（口/皮/吸）Cat.1–3 | 运输侧多对应 6.1（见 TDG 表） |
| **GHS07** | 感叹号 | Exclamation mark | 急性毒性 Cat.4；皮肤刺激 2；眼刺激 2；皮肤致敏 1；STOT-一次接触 Cat.3 | 多为非 TDG 或弱于 6.1 |
| **GHS08** | 健康危害 | Health hazard | 呼吸致敏；致突变；致癌；生殖毒性；STOT 一次 1–2；STOT 反复 1–2；吸入危害 Cat.1 | **一般不单独构成 TDG 类** |
| **GHS09** | 环境 | Environment | 危害水生环境：急性 1；慢性 1–2 | 运输侧常关联第 9 类/鱼树（海运） |

### 重叠规则（培训用）

- **自反应 / 有机过氧化物 Type B**：可同时要求 **GHS01 + GHS02**。  
- 同一产品可有多枚 GHS 图；识读时逐项列危害，再对照 TDG 表决定运输标。  
- **GHS 图在包装上的位置/尺寸** 遵循 CLP/国标等**供应标签**规则，与 **TDG 菱形运输标** 分轨管理，勿混贴、勿互相替代。

---

## 3. 与 TDG / 仓库作业的衔接

```text
SDS 第 2 章 GHS 象形图  →  用本文件识读「有什么危害」
分类鉴定 + SDS 第 14 章 →  用 ghs-tdg-mapping.md 决定「贴什么运输标」
```

| 错误做法 | 正确做法 |
|---|---|
| 看见 GHS05 → 贴 TDG 8 类 | 查鉴定/SDS14 是否有主危或副危 8 |
| 看见 GHS09 → 一律当公路危货 | 核运输分类及海运海洋污染物要求 |
| 用本表代替分类鉴定 | 本表仅培训；发运以受控运输分类为准 |

---

## 4. Agent / Skill

问答「这个 GHS 图代表什么」「腐蚀图含不含眼损伤」时：读本文件。  
问答「要不要贴运输标 / 副危」时：再读 `ghs-tdg-mapping.md` + Skill `dg-ghs-tdg-labeling`。
