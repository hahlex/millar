#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMillarMcpServer } from "./server.js";

const server = createMillarMcpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
