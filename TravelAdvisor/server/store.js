import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { customAlphabet } from "nanoid";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "results.json");
const roomCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 6);
const resultId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ rooms: {} }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}

function writeDb(db) {
  ensureDb();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export function createRoom(name = "我的行程空间") {
  const db = readDb();
  let code = roomCode();
  while (db.rooms[code]) code = roomCode();
  db.rooms[code] = {
    code,
    name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    results: [],
  };
  writeDb(db);
  return db.rooms[code];
}

export function getRoom(code) {
  const db = readDb();
  return db.rooms[String(code || "").toUpperCase()] || null;
}

export function listResults(code) {
  const room = getRoom(code);
  if (!room) return null;
  return [...room.results].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

export function getResult(code, id) {
  const room = getRoom(code);
  if (!room) return null;
  return room.results.find((item) => item.id === id) || null;
}

export function addResult(code, payload) {
  const db = readDb();
  const key = String(code || "").toUpperCase();
  const room = db.rooms[key];
  if (!room) return null;

  const result = {
    id: resultId(),
    title: payload.title,
    destination: payload.destination,
    days: Number(payload.days) || 1,
    budget: payload.budget || "",
    preferences: payload.preferences || "",
    summary: payload.summary,
    itinerary: Array.isArray(payload.itinerary) ? payload.itinerary : [],
    tips: Array.isArray(payload.tips) ? payload.tips : [],
    source: payload.source || "manual",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  room.results.unshift(result);
  room.updatedAt = result.updatedAt;
  writeDb(db);
  return result;
}

export function deleteResult(code, id) {
  const db = readDb();
  const key = String(code || "").toUpperCase();
  const room = db.rooms[key];
  if (!room) return null;
  const before = room.results.length;
  room.results = room.results.filter((item) => item.id !== id);
  if (room.results.length === before) return false;
  room.updatedAt = new Date().toISOString();
  writeDb(db);
  return true;
}
