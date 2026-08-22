import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { handleCanteenApi } from "./src/lib/server-store";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      {
        name: "canteen-api-dev-middleware",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith("/api/canteen/")) {
              const protocol = "http";
              const host = req.headers.host || "localhost";
              const fullUrl = `${protocol}://${host}${req.url}`;

              let bodyStr = "";
              if (req.method === "POST") {
                for await (const chunk of req) {
                  bodyStr += chunk;
                }
              }

              const webReq = new Request(fullUrl, {
                method: req.method,
                headers: req.headers as any,
                body: req.method === "POST" && bodyStr ? bodyStr : undefined,
              });

              try {
                const webRes = await handleCanteenApi(webReq);
                res.statusCode = webRes.status;
                webRes.headers.forEach((val, key) => {
                  res.setHeader(key, val);
                });
                const resBody = await webRes.text();
                res.end(resBody);
                return;
              } catch (err: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ ok: false, error: err?.message }));
                return;
              }
            }
            next();
          });
        },
      },
    ],
  },
});
