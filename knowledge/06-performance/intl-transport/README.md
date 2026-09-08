---
id: intl-transport-archive
owner: logistics
last_updated: 2026-09-08
status: active
source: User HAM→SHA B/L extract 2026-09-07 v2 (107 rows)
scope: International lane lead-time snapshots for comparison; sailing/air days only
---

# 国际运输数据档案

后续对比、滚动分析用的 **业务底表**。计划参数算法仍看 `ham-sha-sailing-lead-time.md`；本目录只存可复用的测量数据，**不覆盖历史快照，只追加**。

管理层 Excel：`deliverables/国际运输数据档案_HAM-SHA航行时间.xlsx`  
生成脚本：`deliverables/source/build_intl_transport_archive.py`

## 1. 现在有什么

| 线路 | 模式 | 方向 | 快照 | ATD 范围 | 状态 |
|---|---|---|---|---|---|
| **HAM→SHA** | 海运 CIF | 进口 | `2026-09-07_ham-sha_lvs` | 2025-11-23 ~ 2026-08-07 | active |
| FRA→PVG | 空运 CIF | 进口 | — | — | 线路已知，**尚无时效提取**（勿编天数） |

HAM→SHA 计量：`Latest Vessel Schedule − ATD`（日历天）。不是 Original ETA，也不是门到独山。

## 2. 文件

| 文件 | 粒度 | 用途 |
|---|---|---|
| `lanes.csv` | 线路 | 线路主数据；新线路先在此登记再收快照 |
| `catalog.csv` | 快照 | 每次提取一行，禁止改旧行的 n / 日期范围 |
| `snapshots/<id>_bl.csv` | 票 | 对比主键：`lane_id + bl_no + atd` |
| `snapshots/<id>_voyage.csv` | 航次 | 计划单元：同一 `atd + schedule_date` |
| `snapshots/<id>_monthly.csv` | 月 | 最短 / 最长 / 均值 / 中位数（voyage + ticket） |
| `snapshots/<id>_coverage.csv` | 窗口 | 工厂 CEILING 覆盖率 k，供对照 |

当前快照文件前缀：`snapshots/2026-09-07_ham-sha_lvs_*`

## 3. 口径（对比时必须对齐）

对比两期数据前，四项都要相同，否则不算同一序列：

1. **metric** — 本快照 = `latest_vessel_schedule_minus_atd`  
2. **grain** — 计划用 `voyage`；`ticket` 只对照  
3. **status 过滤** — 默认只用 `schedule_passed`；`eta` 单独看、不当恢复  
4. **lane_id** — 本快照 = `HAM-SHA`

`status=eta`：船期日 **晚于** 快照 `as_of_date`。本快照截止日 **2026-09-07**，故 2026-07、2026-08 为 ETA。

**禁止：** 覆盖旧 CSV；把 ETA 月与已过船期月直接比快慢；用票数给航次加权；把本表当 ATA 已到港证明。

## 4. 快照 `2026-09-07_ham-sha_lvs` — 月表（业务记录）

107 票，47 航次。7–8 月 ETA。

### 航次等权（计划口径）

| 月 | n | 最短 | 最长 | 算术平均 | 中位数 | status |
|---|---|---|---|---|---|---|
| 2025-11 | 2 | 47 | 47 | 47.0 | 47 | schedule_passed |
| 2025-12 | 5 | 45 | 55 | 48.6 | 47 | schedule_passed |
| 2026-01 | 4 | 41 | 64 | 54.0 | 55.5 | schedule_passed |
| 2026-02 | 5 | 48 | 76 | 55.4 | 52 | schedule_passed |
| 2026-03 | 6 | 36 | 51 | 47.2 | 49 | schedule_passed |
| 2026-04 | 5 | 48 | 58 | 52.8 | 52 | schedule_passed |
| 2026-05 | 4 | 53 | 58 | 55.0 | 54.5 | schedule_passed |
| 2026-06 | 7 | 57 | 71 | 64.7 | 65 | schedule_passed |
| 2026-07 | 7 | 48 | 71 | 61.0 | 62 | **eta** |
| 2026-08 | 2 | 48 | 57 | 52.5 | 52.5 | **eta** |

### 按票（仅对照）

| 月 | n | 最短 | 最长 | 算术平均 | 中位数 | status |
|---|---|---|---|---|---|---|
| 2025-11 | 5 | 47 | 47 | 47.0 | 47 | schedule_passed |
| 2025-12 | 14 | 45 | 55 | 47.6 | 47 | schedule_passed |
| 2026-01 | 10 | 41 | 64 | 51.2 | 48 | schedule_passed |
| 2026-02 | 12 | 48 | 76 | 52.0 | 49 | schedule_passed |
| 2026-03 | 16 | 36 | 51 | 48.6 | 49 | schedule_passed |
| 2026-04 | 11 | 48 | 58 | 51.7 | 51 | schedule_passed |
| 2026-05 | 9 | 53 | 58 | 55.2 | 54 | schedule_passed |
| 2026-06 | 12 | 57 | 71 | 63.9 | 65 | schedule_passed |
| 2026-07 | 15 | 48 | 71 | 59.8 | 62 | **eta** |
| 2026-08 | 3 | 48 | 57 | 51.0 | 48 | **eta** |

### 覆盖率（航次 CEILING，本快照）

| 窗口 | n | 80% | 85% | 90% | 95% |
|---|---|---|---|---|---|
| Feb–May | 20 | 55 | 55 | 58 | 58 |
| Nov–Jun（剔除 ETA） | 38 | 62 | 64 | 69 | 71 |
| Apr–Jun（近 3 完整月） | 16 | 65 | 69 | 70 | 71 |

行级票/航次见 `snapshots/` CSV，不要只靠上表手改数字。

## 5. 以后怎么追加

1. 新提取另存为新 `snapshot_id`（建议 `YYYY-MM-DD_<lane>_<metric短名>`），**不要改旧文件**。  
2. 把票级表放进 `snapshots/`，跑 `deliverables/source/build_intl_transport_archive.py`（或按同 schema 手工写 voyage / monthly）。  
3. `catalog.csv` **追加一行**。  
4. 新线路先写 `lanes.csv`。没有提取就留空，不编天数。  
5. 与上一期对比：同一 `lane_id + metric + grain`，并写明 ETA 是否纳入。  
6. 若要改计划 sailing LT，再更新 `ham-sha-sailing-lead-time.md`，不要只改本档案月表。

## 6. 与其它文件的分工

| 文件 | 角色 |
|---|---|
| **本档案** | 国际运输测量数据（可追加快照） |
| `ham-sha-sailing-lead-time.md` | 工厂 sailing LT 算法与当前建议参数 |
| `03-network/network-overview.md` | 线路是否存在（HAM–SHA、FRA–PVG） |
| `08-systems/` | ERP/TMS **未**接；本档案不是 live TMS |
| 一页纸 PDF | 管理层叙事，不是底表 |
