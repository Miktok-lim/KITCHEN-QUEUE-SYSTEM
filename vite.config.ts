import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { handleCanteenApi } from "./src/lib/server-store";

export default defineConfig({
  nitro: {
    preset: process.env["NITRO_PRESET"] || (process.env["VERCEL"] ? "vercel" : "vercel"),
    // `handlers` works at runtime but is missing from the config's TS types.
    handlers: [
      {
        route: "/**",
        handler: "./src/nitro-ssr-handler.ts",
      },
    ],
  } as never,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    ssr: {
      noExternal: ["tslib"],
    },
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
                method: req.method ?? "GET",
                headers: req.headers as Record<string, string>,
                body: req.method === "POST" && bodyStr ? bodyStr : null,
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
              } catch (err) {
                res.statusCode = 500;
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: err instanceof Error ? err.message : "Internal server error",
                  }),
                );
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
