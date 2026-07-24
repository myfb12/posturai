// Static file server for the PosturAI prototype.
// Serves HTTPS (self-signed) so the device camera works on a phone over the LAN,
// and plain HTTP as a fallback. Run: node server.js
const http = require("http");
const https = require("https");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = __dirname;
const HTTPS_PORT = 5173;
const HTTP_PORT = 5174;

// The LAN address the phone should hit. Detected, not hardcoded — it changes with the network.
function lanIP() {
  for (const iface of Object.values(os.networkInterfaces()).flat()) {
    if (iface.family === "IPv4" && !iface.internal) return iface.address;
  }
  return "localhost";
}
const IP = lanIP();
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
};

function handler(req, res) {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end("Forbidden"); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

// HTTPS (camera-capable). Requires cert.pem + key.pem next to this file.
try {
  const creds = {
    key: fs.readFileSync(path.join(ROOT, "key.pem")),
    cert: fs.readFileSync(path.join(ROOT, "cert.pem")),
  };
  https.createServer(creds, handler).listen(HTTPS_PORT, "0.0.0.0", () =>
    console.log(`HTTPS (camera works): https://${IP}:${HTTPS_PORT}  /  https://localhost:${HTTPS_PORT}`)
  );
} catch (e) {
  console.log("HTTPS disabled (no cert.pem/key.pem) — run: sh make-cert.sh");
}

// Plain HTTP fallback (no camera on a remote device, but handy on the PC).
http.createServer(handler).listen(HTTP_PORT, "0.0.0.0", () =>
  console.log(`HTTP  (no camera on phone): http://localhost:${HTTP_PORT}  /  http://${IP}:${HTTP_PORT}`)
);
