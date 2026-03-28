/**
 * src/index.ts
 * Journey 3: Adding D1 and KV to the Edge Solutions Lab
 */

// Helper interfaces to resolve TypeScript errors if the global types 
// are still being indexed by your editor.
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<any>;
}

export interface Env {
  // Matching the naming in your wrangler.jsonc exactly
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  CONFIG: KVNamespace; 
  appleflare_db: D1Database; // Followed your wrangler.jsonc naming here
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // 1. Intercept our API calls from the React frontend
    if (url.pathname === '/api/hello') {
      const cf = (request as any).cf;
      const city = cf?.city || "the world";
      
      try {
        // Increment the visitor counter in KV
        const currentCount = parseInt(await env.CONFIG.get("visit_count") || "0");
        const newCount = currentCount + 1;
        await env.CONFIG.put("visit_count", newCount.toString());

        // Log the visit to the D1 SQL Database using 'appleflare_db' binding
        await env.appleflare_db.prepare(
          "INSERT INTO logs (timestamp, city, action) VALUES (?, ?, ?)"
        ).bind(new Date().toISOString(), city, "ping").run();

        return new Response(`Hello ${city}! This is visit #${newCount} logged to the Edge via D1.`, {
          headers: { 
            "Content-Type": "text/plain", 
            "Access-Control-Allow-Origin": "*" 
          }
        });
      } catch (err: any) {
        return new Response(`Edge Data Error: ${err.message}`, { status: 500 });
      }
    }

    // 2. Default: Serve the static React assets
    return env.ASSETS.fetch(request);
  },
};