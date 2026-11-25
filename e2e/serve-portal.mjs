import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const PORT = 4173;
const OUT_DIR = path.resolve(import.meta.dirname, "../apps/portal/out");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url ?? "/").split("?")[0];
  if (urlPath === "/favicon.ico") {
    const iconSvg = path.join(OUT_DIR, "brand", "hahlex-mark-color.svg");
    if (fs.existsSync(iconSvg)) {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      fs.createReadStream(iconSvg).pipe(res);
      return;
    }
  }
  if (!urlPath.startsWith("/millar")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  let rel = urlPath.slice("/millar".length) || "/";
  if (rel.endsWith("/")) rel += "index.html";
  const filePath = path.join(OUT_DIR, rel);

  if (!filePath.startsWith(OUT_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    const htmlFallback = path.join(OUT_DIR, rel, "index.html");
    if (fs.existsSync(htmlFallback)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(htmlFallback).pipe(res);
      return;
    }
    res.writeHead(404);
    res.end("404 Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] ?? "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving Millar Portal static export at http://127.0.0.1:${PORT}/millar/`);
});
