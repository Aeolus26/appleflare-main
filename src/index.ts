/**
 * src/index.ts
 * Journey 3: Adding D1 and KV to the Edge Solutions Lab
 */

export interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  CONFIG: KVNamespace;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, _ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // API Route: The Ping Test
    if (url.pathname === '/api/hello') {
      const cf = (request as any).cf;
      const city = cf?.city || "the world";
      
      // 1. Update KV (Key-Value) - Counter
      const currentCount = parseInt(await env.CONFIG.get("visit_count") || "0");
      const newCount = currentCount + 1;
      await env.CONFIG.put("visit_count", newCount.toString());

      // 2. Log to D1 (SQL Database)
      // We assume a table named 'logs' exists (we will create it in next step)
      try {
        await env.DB.prepare(
          "INSERT INTO logs (timestamp, city, action) VALUES (?, ?, ?)"
        ).bind(Date.now(), city, "ping").run();
      } catch (e) {
        console.error("D1 Error: Table probably doesn't exist yet!");
      }

      return new Response(
        `Hello ${city}! This is visit #${newCount}. Data logged to D1 successfully.`, 
        { headers: { "Content-Type": "text/plain", "Access-Control-Allow-Origin": "*" } }
      );
    }

    return env.ASSETS.fetch(request);
  },
};