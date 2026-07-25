import { useEffect, useState } from "react";
import {
  createResult,
  createRoom,
  getRoom,
  listResults,
  removeResult,
  subscribeRoom,
} from "./api.js";

const STORAGE_KEY = "traveladvisor.roomCode";

function formatTime(value) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const initialForm = {
  destination: "京都",
  days: 3,
  budget: "适中",
  preferences: "寺庙、美食、慢旅行",
};

export default function App() {
  const [roomCode, setRoomCode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "",
  );
  const [joinCode, setJoinCode] = useState(
    () => localStorage.getItem(STORAGE_KEY) || "",
  );
  const [roomName, setRoomName] = useState("家庭旅行同步空间");
  const [roomMeta, setRoomMeta] = useState(null);
  const [results, setResults] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selected = results.find((item) => item.id === selectedId) || results[0] || null;

  useEffect(() => {
    if (!roomCode) return undefined;
    let active = true;

    (async () => {
      try {
        setError("");
        const [meta, list] = await Promise.all([
          getRoom(roomCode),
          listResults(roomCode),
        ]);
        if (!active) return;
        setRoomMeta(meta);
        setResults(list.results || []);
        setStatus("live");
        localStorage.setItem(STORAGE_KEY, roomCode.toUpperCase());
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setStatus("idle");
        setRoomMeta(null);
        setResults([]);
      }
    })();

    const unsubscribe = subscribeRoom(roomCode, {
      onResults: (next) => {
        setResults(next);
        setStatus("live");
      },
      onStatus: setStatus,
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [roomCode]);

  useEffect(() => {
    if (!selected) {
      setSelectedId(null);
      return;
    }
    if (!results.some((item) => item.id === selectedId)) {
      setSelectedId(selected.id);
    }
  }, [results, selected, selectedId]);

  async function handleCreateRoom() {
    setBusy(true);
    setError("");
    try {
      const room = await createRoom(roomName.trim() || "我的行程空间");
      setRoomCode(room.code);
      setJoinCode(room.code);
      setRoomMeta(room);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleJoinRoom(event) {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("请输入同步码");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await getRoom(code);
      setRoomCode(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate(event) {
    event.preventDefault();
    if (!roomCode) return;
    setBusy(true);
    setError("");
    try {
      const result = await createResult(roomCode, {
        ...form,
        days: Number(form.days) || 3,
      });
      setSelectedId(result.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!roomCode || !id) return;
    setBusy(true);
    setError("");
    try {
      await removeResult(roomCode, id);
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function copyCode() {
    if (!roomCode) return;
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <h1 className="brand">TravelAdvisor</h1>
        <p className="lede">
          把行程输出放到云端同步空间。手机和电脑输入同一个同步码，就能实时互看跑出来的结果。
        </p>
      </header>

      {!roomCode ? (
        <div className="grid-2">
          <section className="panel">
            <h2>创建同步空间</h2>
            <p className="help">适合第一次使用：生成同步码后发给另一台设备。</p>
            <div className="field">
              <label htmlFor="roomName">空间名称</label>
              <input
                id="roomName"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="例如：关西五日游"
              />
            </div>
            <div className="actions">
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy}
                onClick={handleCreateRoom}
              >
                生成同步码
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>加入已有空间</h2>
            <p className="help">在手机或电脑上输入另一台设备上的 6 位同步码。</p>
            <form onSubmit={handleJoinRoom}>
              <div className="field">
                <label htmlFor="joinCode">同步码</label>
                <input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="例如：A7K3MP"
                  autoCapitalize="characters"
                  autoCorrect="off"
                />
              </div>
              <div className="actions">
                <button className="btn btn-primary" type="submit" disabled={busy}>
                  进入空间
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : (
        <>
          <section className="panel">
            <h2>{roomMeta?.name || "云端同步空间"}</h2>
            <p className="help">
              任意设备打开同一地址，输入同步码即可互通。新结果会通过实时通道推送到所有在线设备。
            </p>
            <div className="status-row">
              <span className="pill">
                同步码 <strong>{roomCode}</strong>
              </span>
              <span className="pill">
                <span className={`dot ${status}`} />
                {status === "live"
                  ? "实时已连接"
                  : status === "reconnecting"
                    ? "重连中"
                    : "未连接"}
              </span>
              <button className="btn btn-secondary" type="button" onClick={copyCode}>
                复制同步码
              </button>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  setRoomCode("");
                  setJoinCode("");
                  setRoomMeta(null);
                  setResults([]);
                  setStatus("idle");
                }}
              >
                切换空间
              </button>
            </div>
            {error ? <p className="error">{error}</p> : null}
          </section>

          <div className="workspace">
            <section className="panel">
              <h2>生成行程结果</h2>
              <p className="help">在电脑上跑结果，手机立刻能看到；反过来也一样。</p>
              <form onSubmit={handleGenerate}>
                <div className="field">
                  <label htmlFor="destination">目的地</label>
                  <input
                    id="destination"
                    value={form.destination}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, destination: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="days">天数</label>
                  <input
                    id="days"
                    type="number"
                    min="1"
                    max="14"
                    value={form.days}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, days: e.target.value }))
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="budget">预算</label>
                  <select
                    id="budget"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, budget: e.target.value }))
                    }
                  >
                    <option value="节省">节省</option>
                    <option value="适中">适中</option>
                    <option value="舒适">舒适</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="preferences">偏好</label>
                  <textarea
                    id="preferences"
                    value={form.preferences}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        preferences: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="actions">
                  <button className="btn btn-primary" type="submit" disabled={busy}>
                    生成并同步到云端
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <h2>云端结果</h2>
              <p className="help">共 {results.length} 条，最新结果排在前面。</p>
              {results.length === 0 ? (
                <div className="empty">还没有结果。先在左侧生成一条行程。</div>
              ) : (
                <div className="results">
                  {results.map((item) => (
                    <article
                      key={item.id}
                      className={`result-card ${selected?.id === item.id ? "active" : ""}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <h3>{item.title}</h3>
                      <p>{item.summary}</p>
                      <div className="meta">
                        <span>{item.destination}</span>
                        <span>{item.days} 天</span>
                        <span>{formatTime(item.createdAt)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {selected ? (
            <section className="panel detail">
              <header>
                <h3>{selected.title}</h3>
                <p className="help">{selected.summary}</p>
                <div className="meta">
                  <span>预算：{selected.budget || "—"}</span>
                  <span>偏好：{selected.preferences || "—"}</span>
                  <span>同步于 {formatTime(selected.createdAt)}</span>
                </div>
                <div className="actions">
                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={busy}
                    onClick={() => handleDelete(selected.id)}
                  >
                    删除这条结果
                  </button>
                </div>
              </header>

              {selected.itinerary?.map((day) => (
                <div className="day-block" key={`${selected.id}-${day.day}`}>
                  <h4>
                    第 {day.day} 天 · {day.theme}
                  </h4>
                  <p>{day.morning}</p>
                  <p>{day.afternoon}</p>
                  <p>{day.evening}</p>
                </div>
              ))}

              {selected.tips?.length ? (
                <div>
                  <h4>小贴士</h4>
                  <ul className="tips">
                    {selected.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}

      {!roomCode && error ? <p className="error">{error}</p> : null}
    </div>
  );
}
