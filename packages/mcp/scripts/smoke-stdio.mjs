import net from "node:net";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const stdioEntry = path.resolve(import.meta.dirname, "../dist/stdio.js");
const httpEntry = path.resolve(import.meta.dirname, "../dist/http.js");

// 1. Real Stdio Binary Smoke (run from os.tmpdir() to simulate standalone npx usage)
const transport = new StdioClientTransport({ command: process.execPath, args: [stdioEntry], cwd: os.tmpdir() });
const client = new Client({ name: "millar-stdio-smoke", version: "1.0.0" });

await client.connect(transport);
const tools = await client.listTools();
const resources = await client.listResources();
const prompts = await client.listPrompts();

if (tools.tools.length !== 13 || prompts.prompts.length !== 12 || resources.resources.length < 100) {
  console.error("FAIL: Unexpected MCP surface counts", {
    tools: tools.tools.length,
    resources: resources.resources.length,
    prompts: prompts.prompts.length,
  });
  process.exit(1);
}

const comp = await client.callTool({ name: "get_component", arguments: { id: "button", includeSource: true } });
const qaSkill = await client.callTool({ name: "get_skill", arguments: { name: "millar-autonomous-qa" } });
const hardenSkill = await client.callTool({ name: "get_skill", arguments: { name: "millar-diagnose-and-harden" } });
const buildPrompt = await client.getPrompt({
  name: "millar-build-web",
  arguments: { scope: "DataTable", minimalChange: "true" },
});
const qaPrompt = await client.getPrompt({
  name: "millar-autonomous-qa",
  arguments: { targetUrl: "http://localhost:5173" },
});
const hardenPrompt = await client.getPrompt({
  name: "millar-diagnose-and-harden",
  arguments: { target: "packages/cli/src", mode: "harden" },
});
if (
  typeof comp.structuredContent?.sourceCode !== "string" ||
  !comp.structuredContent.sourceCode.includes("export const Button") ||
  qaSkill.structuredContent?.id !== "millar-autonomous-qa" ||
  hardenSkill.structuredContent?.id !== "millar-diagnose-and-harden" ||
  !JSON.stringify(buildPrompt.messages).includes("Minimal-Change Track S") ||
  !JSON.stringify(qaPrompt.messages).includes("millar://skills/millar-autonomous-qa") ||
  !JSON.stringify(hardenPrompt.messages).includes("millar://skills/millar-diagnose-and-harden")
) {
  console.error("FAIL: Standalone includeSource, millar-autonomous-qa, millar-diagnose-and-harden skill, or prompt check failed.");
  process.exit(1);
}
await client.close();

// 2. Real Streamable HTTP Binary Smoke (/health + /mcp roundtrip + Origin guard)
const port = await new Promise((resolve, reject) => {
  const srv = net.createServer();
  srv.listen(0, "127.0.0.1", () => {
    const addr = srv.address();
    srv.close(() => resolve(typeof addr === "object" && addr ? addr.port : 0));
  });
  srv.on("error", reject);
});

const httpProc = spawn(process.execPath, [httpEntry], {
  cwd: os.tmpdir(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

let httpStderr = "";
httpProc.stderr.on("data", (d) => {
  httpStderr += d.toString("utf8");
});

try {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && !httpStderr.includes("listening on")) {
    await new Promise((r) => setTimeout(r, 80));
  }
  const health = await fetch(`http://127.0.0.1:${port}/health`);
  const badOrigin = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: "POST",
    headers: { Origin: "https://evil.example", "Content-Type": "application/json" },
    body: "{}",
  });
  if (health.status !== 200 || badOrigin.status !== 403) {
    console.error("FAIL: HTTP health/origin check failed", { health: health.status, badOrigin: badOrigin.status });
    process.exit(1);
  }
  const httpClient = new Client({ name: "millar-http-smoke", version: "1.0.0" });
  const httpTransport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  await httpClient.connect(httpTransport);
  const httpTools = await httpClient.listTools();
  await httpClient.close();
  if (httpTools.tools.length !== 13) {
    console.error("FAIL: HTTP MCP tools count mismatch", httpTools.tools.length);
    process.exit(1);
  }
} finally {
  httpProc.kill();
}

console.log(
  `PASS: Real stdio + Streamable HTTP binaries verified | tools=${tools.tools.length} | staticResources=${resources.resources.length} | prompts=${prompts.prompts.length}`,
);
