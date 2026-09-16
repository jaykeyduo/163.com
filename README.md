# 163.com · 危险品出口包装与运输标签审核工具

离线单文件 HTML5 内部预审原型（SRS V1.0）。

## 快速开始

用 Edge / Chrome 直接打开：

`dg-export-audit-tool.html`

## 交付物

| 文件 | 说明 |
|------|------|
| `dg-export-audit-tool.html` | 单文件应用（UI + 规则引擎 + 报告） |
| `docs/rules.schema.json` | 规则 JSON Schema |
| `docs/sample-audit.json` | 示例审核数据 |
| `docs/USER_GUIDE.md` | 用户操作说明 |
| `docs/RULE_MAINTENANCE.md` | 规则维护与发布说明 |
| `docs/ACCEPTANCE.md` | 测试用例与验收结果 / 已知限制 |

## 范围摘要

- 海运出口；涂料、固化剂、稀释剂、添加剂
- 演示 UN：1263、3066、3469、3470
- 8 步向导 + 闸门校验 + JSON 导入导出 + 打印报告
- 无 CDN、无登录、无 Cookie、无 localStorage

**声明：** 仅供企业内部预审演示，不替代法定鉴定、检验、申报或承运人最终审核。
