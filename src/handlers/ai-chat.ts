// src/handlers/ai-chat.ts
//
// Handler for POST /api/chat
// - Validates the incoming { message: string } body
// - Calls Workers AI with the configured chat model
// - Returns { reply, model } or { error }
//
// Self-contained: this function is the entire route. It can be lifted into
// any other Worker that has the AI binding.
//
// Journey 11 (AI Gateway) will add a `gateway` option to env.AI.run() here.

const CHAT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8';
const CHAT_SYSTEM_PROMPT =
  'You are Appleflare, a concise AI assistant embedded in a Cloudflare edge demo site. Answer in under 80 words.';

export async function handleAIChat(
  request: Request,
  env: Env
): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed; use POST' },
      { status: 405 }
    );
  }

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
