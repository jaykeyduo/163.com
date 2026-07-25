async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export function createRoom(name) {
  return request("/api/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function getRoom(code) {
  return request(`/api/rooms/${encodeURIComponent(code)}`);
}

export function listResults(code) {
  return request(`/api/rooms/${encodeURIComponent(code)}/results`);
}

export function createResult(code, payload) {
  return request(`/api/rooms/${encodeURIComponent(code)}/results`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removeResult(code, id) {
  return request(
    `/api/rooms/${encodeURIComponent(code)}/results/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function subscribeRoom(code, handlers) {
  const source = new EventSource(
    `/api/rooms/${encodeURIComponent(code)}/stream`,
  );

  source.addEventListener("results_updated", (event) => {
    try {
      const data = JSON.parse(event.data);
      handlers.onResults?.(data.results || []);
    } catch {
      /* ignore malformed payloads */
    }
  });

  source.addEventListener("hello", () => {
    handlers.onStatus?.("live");
  });

  source.onerror = () => {
    handlers.onStatus?.("reconnecting");
  };

  return () => source.close();
}
