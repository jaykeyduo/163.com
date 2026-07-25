# TravelAdvisor · 云端同步

把 TravelAdvisor 的行程输出存到云端同步空间，**手机和电脑用同一个同步码**，即可实时互看结果。

## 怎么用

1. 电脑启动服务后，浏览器打开页面。
2. 点击「生成同步码」，得到 6 位码（例如 `A7K3MP`）。
3. 手机用同一网址打开，输入同步码进入同一空间。
4. 任意一端「生成并同步到云端」，另一端会通过实时通道立刻看到新结果。

## 本地运行

```bash
cd TravelAdvisor
npm install
npm run dev
```

- 前端：http://localhost:5173  
- API：http://localhost:8787  

生产模式（前后端同一端口）：

```bash
npm run build
npm start
```

然后访问 http://localhost:8787 。

> Windows 说明：请用 **命令提示符 CMD** 或 PowerShell 运行上述命令，不要用开始菜单里的 “Node.js” 交互窗口（那个是 `>` 提示符的 REPL）。项目已用 `cross-env` 兼容 Windows。

## 让手机也能访问（云端 / 局域网）

### 方案 A：同一 Wi‑Fi 临时互通

1. 电脑执行 `npm run preview`（或 `npm start`）。
2. 查电脑局域网 IP，例如 `192.168.1.23`。
3. 手机浏览器打开 `http://192.168.1.23:8787`。
4. 两端输入同一同步码。

### 方案 B：部署到公网（推荐，真正云端）

把 `TravelAdvisor` 目录部署到任意支持 Node 的平台（Render / Railway / Fly.io 等）：

- Start command: `npm start`
- Build command: `npm install && npm run build`
- 端口：读取环境变量 `PORT`
- 数据目录：默认 `./data`（可用 `DATA_DIR` 覆盖；请挂持久化磁盘，否则重启会丢结果）

部署完成后，手机和电脑都打开**同一个公网地址**，用同步码互通。

## API 概览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/rooms` | 创建同步空间 |
| GET | `/api/rooms/:code` | 查看空间 |
| GET | `/api/rooms/:code/results` | 列出结果 |
| POST | `/api/rooms/:code/results` | 生成/写入结果 |
| DELETE | `/api/rooms/:code/results/:id` | 删除结果 |
| GET | `/api/rooms/:code/stream` | SSE 实时推送 |

## 说明

- 结果保存在服务端 `data/results.json`，不是只存在某一台手机/电脑本地。
- 实时同步使用 Server-Sent Events（SSE）。
- 当前内置行程生成器可先跑通同步；若你已有自己的 TravelAdvisor 脚本，可直接 `POST /api/rooms/:code/results` 把输出写入同一空间。
