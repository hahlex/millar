#!/usr/bin/env node
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMillarMcpServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 3110);

const httpServer = http.createServer(async (req, res) => {
  if (req.url !== "/mcp") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use POST /mcp" }));
    return;
  }

  const server = createMillarMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

httpServer.listen(PORT, "127.0.0.1", () => {
  console.error(`Millar MCP Streamable HTTP server listening on http://127.0.0.1:${PORT}/mcp`);
});
