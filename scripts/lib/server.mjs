import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, relative, resolve, sep } from "node:path";
import { ROOT } from "./project.mjs";

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

export function startStaticServer({ pageFile, port = 0 } = {}) {
  const defaultPage = pageFile ?? resolve(ROOT, "src/index.html");
  const server = createServer((request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      const requested = decodeURIComponent(url.pathname);
      const candidate = requested === "/" ? defaultPage : resolve(ROOT, `.${requested}`);
      if (!(candidate === ROOT || candidate.startsWith(`${ROOT}${sep}`))) {
        response.writeHead(403).end("Forbidden");
        return;
      }
      if (!existsSync(candidate) || !statSync(candidate).isFile()) {
        response.writeHead(404).end("Not found");
        return;
      }
      response.writeHead(200, {
        "Content-Type": mimeTypes[extname(candidate).toLowerCase()] ?? "application/octet-stream",
        "Cache-Control": "no-store"
      });
      createReadStream(candidate).pipe(response);
    } catch (error) {
      response.writeHead(500).end(error.message);
    }
  });

  return new Promise((resolvePromise, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      const address = server.address();
      const pagePath = relative(ROOT, defaultPage).split(sep).join("/");
      resolvePromise({
        server,
        url: `http://127.0.0.1:${address.port}/${pagePath}`
      });
    });
  });
}
