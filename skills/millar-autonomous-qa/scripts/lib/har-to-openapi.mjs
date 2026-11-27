#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ensureDir,
  MEMORY_DIR,
  parseCliArgs,
  readJsonSafe,
  sanitizeForOutput,
  writeJsonAtomic,
} from "./common.mjs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;
const NUMERIC_ID_RE = /^\d{1,20}$/;

export function generalizePathname(pathname) {
  const parts = String(pathname || "/").split("/");
  const paramExamples = {};
  let idIdx = 0;
  const normalized = parts.map((seg, idx) => {
    if (!seg) return seg;
    if (UUID_RE.test(seg) || OBJECT_ID_RE.test(seg) || NUMERIC_ID_RE.test(seg)) {
      const prev = parts[idx - 1] || "resource";
      const singular = prev.replace(/s$/i, "").replace(/[^a-zA-Z0-9]/g, "") || "item";
      idIdx += 1;
      const paramName = idIdx === 1 ? `${singular}_id` : `${singular}_id_${idIdx}`;
      paramExamples[paramName] = {
        example: seg,
        type: NUMERIC_ID_RE.test(seg) ? "integer" : "string",
        format: UUID_RE.test(seg) ? "uuid" : undefined,
      };
      return `{${paramName}}`;
    }
    return seg;
  });
  return { templatePath: normalized.join("/") || "/", paramExamples };
}

export function inferJsonSchema(sample, depth = 0) {
  if (depth > 3 || sample === null || sample === undefined) {
    return { type: "string" };
  }
  if (typeof sample === "boolean") return { type: "boolean", example: sample };
  if (typeof sample === "number") {
    return Number.isInteger(sample) ? { type: "integer", example: sample } : { type: "number", example: sample };
  }
  if (typeof sample === "string") {
    const schema = { type: "string" };
    if (UUID_RE.test(sample)) schema.format = "uuid";
    if (sample.length <= 80) schema.example = sample;
    return schema;
  }
  if (Array.isArray(sample)) {
    return {
      type: "array",
      items: sample.length > 0 ? inferJsonSchema(sample[0], depth + 1) : { type: "object" },
    };
  }
  if (typeof sample === "object") {
    const properties = {};
    for (const [k, v] of Object.entries(sample).slice(0, 20)) {
      properties[k] = inferJsonSchema(v, depth + 1);
    }
    return { type: "object", properties };
  }
  return { type: "string" };
}

export function synthesizeOpenApiFromObservedTraffic(opts = {}) {
  const memoryDir = path.resolve(opts.memoryDir || MEMORY_DIR);
  const inputPath = path.resolve(opts.inputPath || path.join(memoryDir, "traces", "observed-api-traffic.json"));
  const outPath = path.resolve(opts.outPath || path.join(memoryDir, "synthesized-openapi.json"));

  const obsRes = readJsonSafe(inputPath);
  const records = Array.isArray(obsRes.data?.records) ? obsRes.data.records : [];
  const apiOrigin = opts.apiOrigin || obsRes.data?.apiOrigin || "http://127.0.0.1:3200";

  if (records.length === 0) {
    return { ok: false, pathCount: 0, operationCount: 0, outPath: null, reason: "No observed API traffic records found" };
  }

  const paths = {};
  let operationCount = 0;

  for (const rec of records) {
    if (!rec || typeof rec !== "object" || !rec.pathname || !rec.method) continue;
    const method = String(rec.method).toLowerCase();
    if (!["get", "post", "put", "patch", "delete", "head", "options"].includes(method)) continue;

    // Strip leading /api proxy prefix if present only when apiOrigin differs from frontend proxy;
    // keep exact observed pathname so Schemathesis hits the real live path!
    const { templatePath, paramExamples } = generalizePathname(rec.pathname);
    if (!paths[templatePath]) paths[templatePath] = {};

    const existingOp = paths[templatePath][method];
    if (!existingOp) {
      const parameters = [];
      for (const [pName, pMeta] of Object.entries(paramExamples)) {
        parameters.push({
          name: pName,
          in: "path",
          required: true,
          schema: {
            type: pMeta.type,
            ...(pMeta.format ? { format: pMeta.format } : {}),
            example: pMeta.example,
          },
        });
      }
      for (const qKey of Array.isArray(rec.queryKeys) ? rec.queryKeys.slice(0, 8) : []) {
        if (!parameters.some((p) => p.in === "query" && p.name === qKey)) {
          parameters.push({
            name: String(qKey),
            in: "query",
            required: false,
            schema: { type: "string" },
          });
        }
      }

      const opObj = {
        summary: `Observed ${method.toUpperCase()} ${templatePath}`,
        ...(parameters.length > 0 ? { parameters } : {}),
        responses: {},
      };

      if (rec.requestSample && ["post", "put", "patch"].includes(method)) {
        opObj.requestBody = {
          required: false,
          content: {
            "application/json": {
              schema: inferJsonSchema(rec.requestSample),
            },
          },
        };
      }

      paths[templatePath][method] = opObj;
      operationCount += 1;
    }

    const opRef = paths[templatePath][method];
    const statusKey = String(rec.status && Number(rec.status) >= 100 ? rec.status : 200);
    if (!opRef.responses[statusKey]) {
      opRef.responses[statusKey] = {
        description: `Observed HTTP ${statusKey}`,
        ...(rec.responseSample
          ? {
              content: {
                "application/json": {
                  schema: inferJsonSchema(rec.responseSample),
                },
              },
            }
          : {}),
      };
    }
    // Always document 200/401/403/404/422 so Schemathesis validates real errors instead of false schema failures
    for (const stdStatus of ["200", "400", "401", "403", "404", "422"]) {
      if (!opRef.responses[stdStatus]) {
        opRef.responses[stdStatus] = { description: `Standard HTTP ${stdStatus}` };
      }
    }
  }

  const pathCount = Object.keys(paths).length;
  if (pathCount === 0) {
    return { ok: false, pathCount: 0, operationCount: 0, outPath: null, reason: "No usable API operations synthesized" };
  }

  const spec = sanitizeForOutput({
    openapi: "3.0.3",
    info: {
      title: "Synthesized Autonomous QA OpenAPI Specification",
      version: "0.1.0",
      description: "Passively synthesized from live authenticated Playwright network observations.",
    },
    servers: [{ url: apiOrigin }],
    paths,
  });

  ensureDir(path.dirname(outPath));
  writeJsonAtomic(outPath, spec);
  return { ok: true, pathCount, operationCount, outPath };
}

function main() {
  const { values } = parseCliArgs(process.argv.slice(2), { booleanFlags: ["help"] });
  if (values.help) {
    console.log(
      "Usage: node scripts/lib/har-to-openapi.mjs [--memory-dir <dir>] [--input <path>] [--out <path>] [--api-url <url>]",
    );
    process.exit(0);
  }
  const apiOrigin = values["api-url"] ? new URL(values["api-url"]).origin : undefined;
  const res = synthesizeOpenApiFromObservedTraffic({
    memoryDir: values["memory-dir"],
    inputPath: values.input,
    outPath: values.out,
    apiOrigin,
  });
  console.log(JSON.stringify(res, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
