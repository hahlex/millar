import { randomUUID } from "node:crypto";

/**
 * Built-in declarative Promptfoo custom provider for SSE thread/turn and custom HTTP JSON AI backends.
 * Configured via `aiProviderType: "sse-thread-turns"` or `"http-json"` in target config (no custom boilerplate needed).
 * Reads credentials only from runtime env vars (`tokenEnv`, `headersEnv`), never hardcoding secrets.
 */

function parseHeadersFromConfig(cfg = {}) {
  const headers = { "Content-Type": "application/json" };
  if (cfg.headers && typeof cfg.headers === "object" && !Array.isArray(cfg.headers)) {
    for (const [k, v] of Object.entries(cfg.headers)) {
      if (v !== undefined && v !== null) headers[String(k)] = String(v);
    }
  }
  const headersEnv = cfg.headersEnv ? String(cfg.headersEnv) : "";
  if (headersEnv && process.env[headersEnv]) {
    try {
      const parsed = JSON.parse(String(process.env[headersEnv]));
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed)) {
          if (v !== undefined && v !== null) headers[String(k)] = String(v);
        }
      }
    } catch {
      // ignore invalid JSON headers env
    }
  }
  const tokenEnv = cfg.tokenEnv ? String(cfg.tokenEnv) : "";
  const token = tokenEnv ? String(process.env[tokenEnv] || "").trim() : "";
  if (token && !Object.keys(headers).some((k) => k.toLowerCase() === "authorization")) {
    headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return headers;
}

function renderTemplate(templateObj, vars) {
  if (typeof templateObj === "string") {
    return templateObj.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      k === "uuid" ? randomUUID() : String(vars[k] ?? ""),
    );
  }
  if (Array.isArray(templateObj)) {
    return templateObj.map((v) => renderTemplate(v, vars));
  }
  if (templateObj && typeof templateObj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(templateObj)) {
      out[k] = renderTemplate(v, vars);
    }
    return out;
  }
  return templateObj;
}

function parseSseAnswer(rawText) {
  const deltas = [];
  let finalText = "";
  let errorMsg = "";
  for (const rawLine of String(rawText || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      const obj = JSON.parse(payload);
      if (typeof obj?.delta === "string") deltas.push(obj.delta);
      else if (typeof obj?.token === "string") deltas.push(obj.token);
      else if (typeof obj?.text === "string" && !obj?.final) deltas.push(obj.text);
      else if (typeof obj?.choices?.[0]?.delta?.content === "string") deltas.push(obj.choices[0].delta.content);
      if (typeof obj?.answer === "string") finalText = obj.answer;
      else if (typeof obj?.content === "string" && (obj.type === "done" || obj.type === "message" || obj.role === "assistant")) {
        finalText = obj.content;
      } else if (typeof obj?.message?.content === "string") {
        finalText = obj.message.content;
      } else if (typeof obj?.output === "string") {
        finalText = obj.output;
      }
      if (typeof obj?.error === "string") errorMsg = obj.error;
      else if (typeof obj?.error?.message === "string") errorMsg = obj.error.message;
    } catch {
      // plain text SSE frame
      deltas.push(payload);
    }
  }
  return { text: (finalText || deltas.join("")).trim(), error: errorMsg };
}

export default class BuiltinDeclarativeAiProvider {
  constructor(options = {}) {
    this.providerId = options.id || "millar-builtin-ai";
    this.cfg = options.config || {};
  }

  id() {
    return this.providerId;
  }

  async callApi(prompt) {
    const type = String(this.cfg.providerType || "sse-thread-turns").toLowerCase();
    const baseUrl = String(this.cfg.baseUrl || this.cfg.aiUrl || "http://127.0.0.1:8100").replace(/\/+$/, "");
    const timeoutMs = Math.max(5000, Number(this.cfg.requestTimeoutMs || 45000));
    const headers = parseHeadersFromConfig(this.cfg);

    if (type === "http-json") {
      const endpoint = String(this.cfg.endpointPath || "/v1/chat/completions");
      const url = new URL(endpoint, `${baseUrl}/`).toString();
      const bodyTemplate = this.cfg.bodyTemplate || { prompt: "{{prompt}}" };
      const body = renderTemplate(bodyTemplate, { prompt });
      const res = await fetch(url, {
        method: String(this.cfg.method || "POST").toUpperCase(),
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await res.text();
      if (!res.ok) {
        return { error: `HTTP ${res.status} from ${endpoint}: ${text.slice(0, 240)}` };
      }
      try {
        const json = JSON.parse(text);
        const answer =
          json?.choices?.[0]?.message?.content ??
          json?.output ??
          json?.answer ??
          json?.content ??
          json?.message ??
          text;
        return { output: typeof answer === "string" ? answer : JSON.stringify(answer) };
      } catch {
        return { output: text };
      }
    }

    // Default: sse-thread-turns (POST thread -> POST turn SSE stream -> optional messages fallback + cleanup)
    const threadPath = String(this.cfg.threadPath || "/v1/assistant/threads");
    const turnPathTemplate = String(this.cfg.turnPathTemplate || "/v1/assistant/threads/{{threadId}}/turns");
    const messagesPathTemplate = this.cfg.messagesPathTemplate ? String(this.cfg.messagesPathTemplate) : "";
    const cleanupThread = this.cfg.cleanupThread !== false;
    const threadBody = renderTemplate(
      this.cfg.threadBody || { title: "Autonomous QA Probe" },
      { prompt },
    );

    let threadId = "";
    try {
      const threadRes = await fetch(new URL(threadPath, `${baseUrl}/`).toString(), {
        method: "POST",
        headers,
        body: JSON.stringify(threadBody),
        signal: AbortSignal.timeout(Math.min(15000, timeoutMs)),
      });
      const threadRaw = await threadRes.text();
      if (!threadRes.ok) {
        return { error: `Thread create failed HTTP ${threadRes.status}: ${threadRaw.slice(0, 240)}` };
      }
      try {
        const parsed = JSON.parse(threadRaw);
        threadId = String(parsed?.id || parsed?.thread_id || parsed?.threadId || parsed?.data?.id || "");
      } catch {
        threadId = "";
      }
      if (!threadId) {
        return { error: `Thread create response missing thread id: ${threadRaw.slice(0, 200)}` };
      }

      const turnPath = turnPathTemplate.replaceAll("{{threadId}}", encodeURIComponent(threadId));
      const turnBody = renderTemplate(
        this.cfg.turnBodyTemplate || { message: "{{prompt}}" },
        { prompt, threadId },
      );
      const turnRes = await fetch(new URL(turnPath, `${baseUrl}/`).toString(), {
        method: "POST",
        headers: { ...headers, Accept: "text/event-stream, application/json" },
        body: JSON.stringify(turnBody),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const turnRaw = await turnRes.text();
      if (!turnRes.ok) {
        return { error: `Turn stream failed HTTP ${turnRes.status}: ${turnRaw.slice(0, 240)}` };
      }

      let finalOutput = "";
      const ct = String(turnRes.headers.get("content-type") || "").toLowerCase();
      if (ct.includes("text/event-stream") || turnRaw.includes("\ndata:") || turnRaw.startsWith("data:")) {
        const parsedSse = parseSseAnswer(turnRaw);
        if (parsedSse.error && !parsedSse.text) {
          return { error: parsedSse.error };
        }
        finalOutput = parsedSse.text;
      } else {
        try {
          const json = JSON.parse(turnRaw);
          const ans = json?.answer ?? json?.content ?? json?.output ?? json?.message?.content ?? turnRaw;
          finalOutput = typeof ans === "string" ? ans : JSON.stringify(ans);
        } catch {
          finalOutput = turnRaw;
        }
      }

      if (!finalOutput && messagesPathTemplate) {
        const msgPath = messagesPathTemplate.replaceAll("{{threadId}}", encodeURIComponent(threadId));
        const msgRes = await fetch(new URL(msgPath, `${baseUrl}/`).toString(), {
          method: "GET",
          headers,
          signal: AbortSignal.timeout(6000),
        });
        if (msgRes.ok) {
          const msgData = await msgRes.json().catch(() => null);
          const items = msgData?.items || msgData?.messages || (Array.isArray(msgData) ? msgData : []);
          const lastAsst = [...items].reverse().find((m) => m?.role === "assistant");
          if (lastAsst?.content) finalOutput = String(lastAsst.content).trim();
        }
      }

      return finalOutput ? { output: finalOutput } : { error: "Assistant returned empty response" };
    } finally {
      if (threadId && cleanupThread) {
        const delPath = `${threadPath.replace(/\/+$/, "")}/${encodeURIComponent(threadId)}`;
        await fetch(new URL(delPath, `${baseUrl}/`).toString(), {
          method: "DELETE",
          headers,
          signal: AbortSignal.timeout(4000),
        }).catch(() => {});
      }
    }
  }
}
