import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import path from "node:path";
const root = path.resolve(process.argv[2] || "site");
const port = Number(process.argv[3] || 8801);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".ico": "image/x-icon" };
createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (existsSync(p) && statSync(p).isDirectory()) p = path.join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404); return res.end("404"); }
  res.writeHead(200, { "content-type": types[path.extname(p).toLowerCase()] || "application/octet-stream" });
  createReadStream(p).pipe(res);
}).listen(port, "127.0.0.1");
