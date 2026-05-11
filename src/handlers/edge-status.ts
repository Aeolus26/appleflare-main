// src/handlers/edge-status.ts
//
// Handler for GET /api/hello
// - Reads geo info from request.cf
// - Increments visit counter in KV (CONFIG)
// - Inserts a row into D1 (appleflare_db)
// - Returns a plain-text greeting
//
// Self-contained: this function is the entire route. It can be lifted into
// any other Worker that has the CONFIG (KV) and appleflare_db (D1) bindings.

export async function handleEdgeStatus(
  request: Request,
  env: Env
): Promise<Response> {
  const cf = request.cf;
  const city = (cf?.city as string | undefined) ?? 'the world';

  try {
    // KV: increment visitor counter.
    const currentCount = parseInt(
      (await env.CONFIG.get('visit_count')) ?? '0',
      10
    );
    const newCount = currentCount + 1;
    await env.CONFIG.put('visit_count', newCount.toString());

    // D1: log the visit.
    await env.appleflare_db
      .prepare('INSERT INTO logs (timestamp, city, action) VALUES (?, ?, ?)')
      .bind(new Date().toISOString(), city, 'ping')
      .run();

    return new Response(
      `Hello ${city}! This is visit #${newCount} logged to the Edge via D1.`,
      {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return new Response(`Edge Data Error: ${message}`, { status: 500 });
  }
}
