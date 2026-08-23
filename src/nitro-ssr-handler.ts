import { defineEventHandler } from "h3";

export default defineEventHandler(async (event) => {
  const ssr = (globalThis as any).__nitro_vite_envs__?.["ssr"];
  if (ssr) {
    const req =
      (event as any).web?.request ||
      ((event as any).req instanceof Request ? (event as any).req : undefined) ||
      new Request(event.url ? event.url.href : "http://localhost/", {
        method: event.method,
        headers: event.headers as any,
      });
    return await ssr.fetch(req);
  }
});
