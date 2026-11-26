#!/usr/bin/env node
/**
 * Zero-dependency PNG tEXt provenance embedder & reader for Millar Create Image v0.4.
 *
 * Embeds standard PNG tEXt chunks (MillarPrompt, MillarBrandSource, MillarMethod, MillarVersion)
 * cleanly before IEND with valid IEEE CRC32 checksums, and optionally writes <image>.prompt.json.
 *
 * Usage:
 *   node embed-provenance.mjs <image.png> --prompt="..." [--brand="..."] [--method="..."] [--sidecar]
 *   node embed-provenance.mjs --read <image.png>
 */

import fs from "node:fs";
import path from "node:path";

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// Standard IEEE 802.3 CRC32 table for PNG chunks
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function toLatin1Safe(str) {
  return String(str)
    .replace(/[\u2014\u2013]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2192/g, "->")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, " ");
}

function makeTextChunk(keyword, value) {
  const keyBuf = Buffer.from(toLatin1Safe(keyword).slice(0, 79), "latin1");
  const valBuf = Buffer.from(toLatin1Safe(value), "latin1");
  const data = Buffer.concat([keyBuf, Buffer.from([0]), valBuf]);
  const type = Buffer.from("tEXt", "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([type, data])), 0);
  return Buffer.concat([len, type, data, crc]);
}

function parseChunks(buf) {
  if (buf.length < 8 || !buf.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error("Input file is not a valid PNG.");
  }
  const chunks = [];
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.subarray(offset + 4, offset + 8).toString("ascii");
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const crcEnd = dataEnd + 4;
    if (crcEnd > buf.length) throw new Error(`Truncated PNG chunk ${type} at offset ${offset}`);
    chunks.push({
      type,
      data: buf.subarray(dataStart, dataEnd),
      raw: buf.subarray(offset, crcEnd),
    });
    offset = crcEnd;
  }
  return chunks;
}

function readProvenance(filePath) {
  const buf = fs.readFileSync(filePath);
  const chunks = parseChunks(buf);
  const meta = {};
  for (const ch of chunks) {
    if (ch.type === "tEXt") {
      const nul = ch.data.indexOf(0);
      if (nul > 0) {
        const key = ch.data.subarray(0, nul).toString("latin1");
        const val = ch.data.subarray(nul + 1).toString("latin1");
        meta[key] = val;
      }
    }
  }
  return meta;
}

function embedProvenance(filePath, entries) {
  const buf = fs.readFileSync(filePath);
  const chunks = parseChunks(buf);
  const keysToReplace = new Set(Object.keys(entries));
  const outChunks = [];

  for (const ch of chunks) {
    if (ch.type === "tEXt") {
      const nul = ch.data.indexOf(0);
      const key = nul > 0 ? ch.data.subarray(0, nul).toString("latin1") : "";
      if (keysToReplace.has(key)) continue;
    }
    if (ch.type === "IEND") {
      for (const [k, v] of Object.entries(entries)) {
        if (v !== undefined && v !== "") {
          outChunks.push(makeTextChunk(k, v));
        }
      }
    }
    outChunks.push(ch.raw);
  }

  fs.writeFileSync(filePath, Buffer.concat([PNG_SIG, ...outChunks]));
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    console.log(
      'Usage:\n  node embed-provenance.mjs <image.png> --prompt="..." [--brand="..."] [--method="..."] [--aspect="16:9"] [--sidecar]\n  node embed-provenance.mjs --read <image.png>',
    );
    process.exit(0);
  }

  if (args[0] === "--read") {
    const file = path.resolve(args[1] ?? "");
    console.log(JSON.stringify(readProvenance(file), null, 2));
    return;
  }

  const filePath = path.resolve(args[0]);
  const getFlag = (name) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const prompt = getFlag("prompt") ?? "";
  const brand = getFlag("brand") ?? "";
  const method = getFlag("method") ?? "millar-create-image-v0.4";
  const aspect = getFlag("aspect") ?? "16:9";
  const writeSidecar = args.includes("--sidecar");

  if (!prompt) {
    console.error("ERROR: --prompt=... is required.");
    process.exit(1);
  }

  embedProvenance(filePath, {
    MillarVersion: "0.4.0",
    MillarMethod: method,
    MillarBrandSource: brand,
    MillarAspect: aspect,
    MillarPrompt: prompt,
  });

  if (writeSidecar) {
    const parsed = path.parse(filePath);
    const sidecarPath = path.join(parsed.dir, `${parsed.name}.prompt.json`);
    fs.writeFileSync(
      sidecarPath,
      JSON.stringify(
        {
          file: filePath,
          version: "0.4.0",
          aspectRatio: aspect,
          brandSource: brand,
          method,
          promptEn: prompt,
          pngTextEmbedded: true,
        },
        null,
        2,
      ),
    );
  }

  console.log(`PASS: Embedded PNG tEXt provenance into ${path.basename(filePath)}${writeSidecar ? " + .prompt.json sidecar" : ""}.`);
}

main();
