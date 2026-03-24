/**
 * src/index.ts
 * This is the entry point for your Cloudflare Worker.
 * It intercepts API calls (like /api/hello) and serves your React frontend for everything else.
 */
export interface Env {
  // Bindings (like D1, KV, R2) will be added here as we progress
}


export default {
  async fetch(
    request: Request,
    _env: Env,       // Added underscore to prevent "unused variable" error
    _ctx: any        // Added underscore and changed type to 'any' for simplicity
  ): Promise<Response> {
    const url = new URL(request.url);

    // 1. Intercept our API calls from the React frontend
    if (url.pathname === '/api/hello') {
      // Cloudflare adds geographic data to the request object.
      // We cast to 'any' so TypeScript doesn't complain about the '.cf' property.
      const cf = (request as any).cf;
      const city = cf?.city || "the world";

      return new Response(`Hello to you in ${city}! The Edge Worker intercepted this successfully.`, {
        headers: { 
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*" // Allows the local dev server to talk to the worker
        }
      });
    }

    // 2. If it's not an API call, serve the static assets (the React app)
    // We use globalThis.fetch to avoid a recursive loop
    return (globalThis as any).fetch(request);
  },
};