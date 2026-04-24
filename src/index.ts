/**
 * appleflare-main — Edge Worker
 *
 * Responsibilities:
 *   - /api/hello → geo-aware greeting + KV visitor counter + D1 log insert
 *   - /api/chat  → Workers AI chat completion (Llama 3)
 *   - /*         → serves the React SPA via env.ASSETS
 *
 * Bindings are declared in wrangler.jsonc and typed in worker-configuration.d.ts
 * (regenerate with `npx wrangler types` after changing bindings).
 */

const CHAT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
const CHAT_SYSTEM_PROMPT =
	'You are Appleflare, a concise AI assistant embedded in a Cloudflare edge demo site. Answer in under 80 words.';

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

		// --- /api/chat — Workers AI (Llama 3) --------------------------------
		if (url.pathname === '/api/chat' && request.method === 'POST') {
			try {
				const body = (await request.json()) as { message?: unknown };
				const message = body.message;

				if (typeof message !== 'string' || message.trim().length === 0) {
					return Response.json(
						{ error: 'Missing or invalid "message" field' },
						{ status: 400 }
					);
				}

				const ai = await env.AI.run(CHAT_MODEL, {
					messages: [
						{ role: 'system', content: CHAT_SYSTEM_PROMPT },
						{ role: 'user', content: message },
					],
				});

				// Non-streaming response shape: { response: string }
				const reply = (ai as { response?: string }).response ?? '';
				return Response.json({ reply, model: CHAT_MODEL });
			} catch (err) {
				const message = err instanceof Error ? err.message : 'Unknown AI error';
				return Response.json({ error: message }, { status: 500 });
			}
		}

		// --- SPA fallthrough --------------------------------------------------
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
