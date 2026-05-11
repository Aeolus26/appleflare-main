/**
 * appleflare-main — Edge Worker (router)
 *
 * Thin dispatcher. All business logic lives in src/handlers/*.
 * Adding a new route = create a handler file + add one line below.
 *
 * Bindings declared in wrangler.jsonc and typed in worker-configuration.d.ts.
 * Regenerate types with `npx wrangler types` after binding changes.
 */

import { handleEdgeStatus } from './handlers/edge-status';
import { handleAIChat } from './handlers/ai-chat';
import { handleApiShield } from './handlers/api-shield';

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // --- API routes -------------------------------------------------------
    if (url.pathname === '/api/hello') {
      return handleEdgeStatus(request, env);
    }

    if (url.pathname === '/api/chat') {
      return handleAIChat(request, env);
    }

    if (url.pathname.startsWith('/api/shield/')) {
      return handleApiShield(request, env);
    }

    // --- SPA fallthrough --------------------------------------------------
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
