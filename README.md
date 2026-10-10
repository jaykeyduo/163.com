# 163.com · 出口危险品管理工具

## 当前主工具（V6）

用 Edge / Chrome 直接打开：

`dg-export-tool-v6.html`

- 工具版本：`6.0.0`
- 本地缓存键：`mkq-dg-export-v6`（与 V5/`mkq-dg-export-v5` **不共用**；打开 V6 不会自动带入旧缓存）

功能模块：

1. **包装性能单** — PDF/粘贴导入、清单编辑、多条件筛选、CSV/JSON 导出  
2. **危包证** — PDF/粘贴导入与清单  
3. **运单 DO** — Delivery Header + Product/Batch Item 行项目读取、筛选、导出  
4. **SDS** — 中文安全数据单 PDF 解析（办危包证相关字段：产品代码、中英文名称、Sec.9 密度/闪点/状态、Sec.14 IMDG UN/类别/包装类别/PSN/EmS 等）  
5. **数据结合** — 框架占位；只读预览证↔性能单、SDS↔危包证  

样例：

- DO：`samples/do/83231976.pdf`、`samples/do/83255460.pdf`
- SDS：`samples/sds/*.pdf`（5 份 Mankiewicz 中文 SDS；文本夹具 `samples/sds/fixtures/`）

解析器单元测试：

```bash
node scripts/test-perf-mark-filter.mjs
node scripts/test-do-parse.mjs
node scripts/test-sds-parse.mjs
```

### V6 相对 V5

- 正式升版：文件名 `dg-export-tool-v6.html`，页头标明 V6  
- 缓存键升级为 `mkq-dg-export-v6`  
- 新增 SDS 读取模块；数据结合顺延为第 5 页签  

### 历史文件

| 文件 | 说明 |
|------|------|
| `dg-export-tool-v6.html` | **当前主工具** |
| `dg-export-tool-v5.html` | V5 快照（缓存键 `mkq-dg-export-v5`） |
| `dg-export-tool-v4.html` | V4 快照（旧缓存键 `mkq-dg-export-v1`） |
| `dg-export-audit-tool.html` | 旧版包装与运输标签预审向导 |
| `docs/` | 预审工具配套文档 |

**声明：** 仅供企业内部资料整理与预审辅助，不替代法定鉴定、检验、申报或承运人最终审核。
