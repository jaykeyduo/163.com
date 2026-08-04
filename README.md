# Logistics Advisor Agent

涂料生产公司物流战略顾问 Agent（德国总部 · 中国嘉兴工厂）。

## 设计原则

**改背景 = 改文件。** Agent 的行为与建议质量由仓库内文件驱动；日常维护只需更新对应背景文件，无需重写 Agent 本身。

## 目录总览

```text
.
├── agent/                 # Agent 运行层（角色、路由、输出模板）— 少改
├── knowledge/             # 背景知识层 — 主要维护入口
├── projects/              # 在建/规划物流项目
├── decisions/             # 决策与建议归档（追加为主）
└── .cursor/rules/         # Cursor 规则：强制 Agent 读取上述文件
```

详细设计见 [`docs/AGENT_FRAMEWORK.md`](docs/AGENT_FRAMEWORK.md)。

## 快速开始

1. 阅读 `docs/AGENT_FRAMEWORK.md`，确认分层与维护规则
2. 按 `knowledge/` 各目录下的 `README.md` 填写背景
3. 战略目标与痛点优先填 `knowledge/05-strategy/`
4. 向 Agent 提问时，它会按 `agent/ROUTING.md` 检索对应知识文件

## 维护口诀

| 要改什么 | 改哪里 |
|---|---|
| 公司/组织/网络事实 | `knowledge/` 对应子目录 |
| Agent 说话方式、决策原则 | `agent/AGENT.md` |
| 输出格式 | `agent/OUTPUT_TEMPLATES.md` |
| 某类问题该读哪些文件 | `agent/ROUTING.md` |
| 在建项目进展 | `projects/` |
| 已拍板的决策 | `decisions/` |
