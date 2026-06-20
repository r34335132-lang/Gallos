const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..", "dist");
const port = Number(process.env.PORT || 8080);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function resolveFile(requestUrl) {
  const cleanUrl = decodeURIComponent((requestUrl || "/").split("?")[0]);
  const target = path.join(root, cleanUrl === "/" ? "index.html" : cleanUrl);
  if (target.startsWith(root) && fs.existsSync(target) && fs.statSync(target).isFile()) {
    return target;
  }
  return path.join(root, "index.html");
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url);
    res.writeHead(200, { "content-type": mime[path.extname(file)] || "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Gallos PWA ready at http://127.0.0.1:${port}`);
  });
