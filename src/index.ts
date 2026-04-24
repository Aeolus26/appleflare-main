/**
 * appleflare-main — Edge Worker
 *
 * Responsibilities:
 *   - /api/hello → geo-aware greeting + KV visitor counter + D1 log insert
 *   - /*         → serves the React SPA via env.ASSETS
 *
 * Bindings are declared in wrangler.jsonc and typed in worker-configuration.d.ts
 * (regenerate with `npx wrangler types` after changing bindings).
 */

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		// --- API routes -------------------------------------------------------
		if (url.pathname === '/api/hello') {
			const cf = request.cf;
			const city = (cf?.city as string | undefined) ?? 'the world';

			try {
				// KV: increment visitor counter
				const currentCount = parseInt((await env.CONFIG.get('visit_count')) ?? '0', 10);
				const newCount = currentCount + 1;
				await env.CONFIG.put('visit_count', newCount.toString());

				// D1: log the visit
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

		// --- SPA fallthrough --------------------------------------------------
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
