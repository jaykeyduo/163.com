# 163.com · 出口危险品管理工具

## 当前主工具（继续修改）

用 Edge / Chrome 直接打开：

`dg-export-tool-v4.html`

功能模块：

1. **包装性能单** — PDF/粘贴导入、清单编辑、多条件筛选、CSV/JSON 导出  
2. **危包证** — PDF/粘贴导入与清单  
3. **运单 DO** — Delivery Header + Product/Batch Item 行项目读取、筛选、导出  
4. **数据结合** — 框架占位  

样例 DO：`samples/do/83231976.pdf`、`samples/do/83255460.pdf`

### v4 近期修复 / 新增

- 纸箱「包装容器标记及批号」漏读：支持 `4G/Yxx/S/yy` 与带尾部下划线 / 空格的 `CN/…PI`  
- 包装性能单多条件筛选（AND）：包装使用人 / 本单有效期截止 / 运输方式 / 包装容器标记及批号  
- 运单 DO：Header=`Delivery号码`；Item=`Product no.`+`Batch no.`；含产品描述/额外描述/manufactured/Use by end of/Country of origin；支持跨页拼接  


## 其它交付物

| 文件 | 说明 |
|------|------|
| `dg-export-tool-v4.html` | 出口危险品管理工具（本分支主改） |
| `dg-export-audit-tool.html` | 旧版包装与运输标签预审向导（SRS V1.0） |
| `docs/` | 预审工具配套文档 |

**声明：** 仅供企业内部资料整理与预审辅助，不替代法定鉴定、检验、申报或承运人最终审核。
