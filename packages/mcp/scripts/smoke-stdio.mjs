import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const stdioEntry = path.resolve(import.meta.dirname, "../dist/stdio.js");
const transport = new StdioClientTransport({ command: "node", args: [stdioEntry] });
const client = new Client({ name: "millar-stdio-smoke", version: "1.0.0" });

await client.connect(transport);
const tools = await client.listTools();
const resources = await client.listResources();
const prompts = await client.listPrompts();

if (tools.tools.length !== 13 || prompts.prompts.length !== 7 || resources.resources.length < 15) {
  console.error("FAIL: Unexpected MCP surface counts", {
    tools: tools.tools.length,
    resources: resources.resources.length,
    prompts: prompts.prompts.length,
  });
  process.exit(1);
}

console.log(
  `PASS: Real stdio binary verified | tools=${tools.tools.length} | staticResources=${resources.resources.length} | prompts=${prompts.prompts.length}`,
);
await client.close();
