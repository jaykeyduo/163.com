import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateAdvice } from "./advisor.js";
import {
  addResult,
  createRoom,
  deleteResult,
  getResult,
  getRoom,
  listResults,
} from "./store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const PORT = Number(process.env.PORT) || 8787;

const app = express();
const roomClients = new Map();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

function broadcast(code, event, data) {
  const key = String(code || "").toUpperCase();
  const clients = roomClients.get(key);
  if (!clients?.size) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) {
    res.write(payload);
  }
}

function trackClient(code, res) {
  const key = String(code || "").toUpperCase();
  if (!roomClients.has(key)) roomClients.set(key, new Set());
  roomClients.get(key).add(res);
  return () => {
    const set = roomClients.get(key);
    if (!set) return;
    set.delete(res);
    if (!set.size) roomClients.delete(key);
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "TravelAdvisor Cloud Sync" });
});

app.post("/api/rooms", (req, res) => {
  const room = createRoom(req.body?.name);
  res.status(201).json(room);
});

app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "同步空间不存在" });
  res.json({
    code: room.code,
    name: room.name,
    createdAt: room.createdAt,
    updatedAt: room.updatedAt,
    resultCount: room.results.length,
  });
});

app.get("/api/rooms/:code/results", (req, res) => {
  const results = listResults(req.params.code);
  if (!results) return res.status(404).json({ error: "同步空间不存在" });
  res.json({ results });
});

app.get("/api/rooms/:code/results/:id", (req, res) => {
  const result = getResult(req.params.code, req.params.id);
  if (!result) return res.status(404).json({ error: "结果不存在" });
  res.json(result);
});

app.post("/api/rooms/:code/results", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "同步空间不存在" });

  const { destination, days, budget, preferences, title, summary, itinerary, tips, mode } =
    req.body || {};

  let payload;
  if (mode === "manual") {
    if (!title || !destination) {
      return res.status(400).json({ error: "请填写标题和目的地" });
    }
    payload = {
      title,
      destination,
      days,
      budget,
      preferences,
      summary: summary || `${destination} 行程结果`,
      itinerary: itinerary || [],
      tips: tips || [],
      source: "manual",
    };
  } else {
    if (!destination) {
      return res.status(400).json({ error: "请填写目的地" });
    }
    payload = generateAdvice({ destination, days, budget, preferences });
  }

  const result = addResult(req.params.code, payload);
  broadcast(req.params.code, "result_created", result);
  broadcast(req.params.code, "results_updated", {
    results: listResults(req.params.code),
  });
  res.status(201).json(result);
});

app.delete("/api/rooms/:code/results/:id", (req, res) => {
  const ok = deleteResult(req.params.code, req.params.id);
  if (ok === null) return res.status(404).json({ error: "同步空间不存在" });
  if (!ok) return res.status(404).json({ error: "结果不存在" });
  broadcast(req.params.code, "result_deleted", { id: req.params.id });
  broadcast(req.params.code, "results_updated", {
    results: listResults(req.params.code),
  });
  res.json({ ok: true });
});

app.get("/api/rooms/:code/stream", (req, res) => {
  const room = getRoom(req.params.code);
  if (!room) return res.status(404).json({ error: "同步空间不存在" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const untrack = trackClient(req.params.code, res);
  res.write(
    `event: hello\ndata: ${JSON.stringify({
      code: room.code,
      connectedAt: new Date().toISOString(),
    })}\n\n`,
  );
  res.write(
    `event: results_updated\ndata: ${JSON.stringify({
      results: listResults(req.params.code),
    })}\n\n`,
  );

  const heartbeat = setInterval(() => {
    res.write(`event: ping\ndata: ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    untrack();
  });
});

// Serve the built UI whenever dist/ exists (Windows-friendly; no shell env required).
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(DIST, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`TravelAdvisor cloud sync listening on http://0.0.0.0:${PORT}`);
});
