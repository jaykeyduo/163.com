# 规则维护与发布说明

## 规则位置

全部演示规则集中在 `dg-export-audit-tool.html` 内的 `RULES` 对象，包含：

- `meta`：schemaVersion、ruleVersion、regulationVersion、effectiveDate、sourceReference、status
- `unRules`：UN1263 / 3066 / 3469 / 3470 的 DGL 演示字段
- `specialProvisions`：SP163、SP198、SP232、SP274、SP944
- `packages`：企业包装主数据演示
- `eqCodes`、`pgPerformanceMap`、`packingInstructionNotes`

结构化约束见 `docs/rules.schema.json`。

## 维护原则

1. **法规数据与程序逻辑分离**：只改 `RULES`，避免在闸门函数中硬编码个别 UN 特例（除非业务闸门本身）。
2. **status 必须为 DEMO / DRAFT / APPROVED**；未经验证数据不得标为 APPROVED。
3. 变更规则时递增 `ruleVersion`，填写 `effectiveDate`，并在 `sourceReference` 记录批准人。
4. 每条 UN 必须列出**全部**适用 SP；引擎会逐条加载，不允许“匹配首条即停止”。
5. LQ 第7a、EQ 第7b、P Code、标签要求变更须双人复核后发布。

## 发布检查清单

- [ ] 字段通过 schema 校验
- [ ] 重点 UN 与 SP 有出处与企业解释
- [ ] 包装主数据证书编号与相容性状态可追溯
- [ ] HTML 内无外部 URL / CDN / 存储 API
- [ ] 导出规则 JSON 与页面内嵌一致
- [ ] 验收用例 AC-01～AC-10 回归通过

## V2 方向

将 `RULES` 迁移至受控规则服务；本文件 HTML 仅保留导入接口与离线演示能力。
