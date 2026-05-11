// src/handlers/api-shield.ts
//
// API Shield demo handler.
//
// Routes handled (all under /api/shield/):
//   GET  /api/shield/httpbin/ip           → simulated httpbin /ip
//   GET  /api/shield/httpbin/headers      → simulated httpbin /headers
//   GET  /api/shield/httpbin/uuid         → simulated httpbin /uuid
//   GET  /api/shield/httpbin/json         → simulated httpbin /json
//   GET  /api/shield/httpbin/status/:code → simulated httpbin /status/:code
//   ANY  /api/shield/petstore/*           → reverse proxy → petstore.work.appleflare.win
//   POST /api/shield/traffic              → fires 25 varied requests (demo traffic burst)
//
// Why simulate httpbin in the Worker?
//   httpbin.org is unreliable for demos. A Worker-based simulation is always
//   available, responds predictably, and still flows through Cloudflare edge
//   so API Shield logs it as real traffic.
//
// Journey 36 note:
//   When gaming PC tunnel is stable, remove the httpbin simulation and point
//   /api/shield/httpbin/* to https://httpbin.appleflare.win/* instead.

const PETSTORE_ORIGIN = 'https://petstore.work.appleflare.win';

// ---------------------------------------------------------------------------
// Httpbin simulation
// ---------------------------------------------------------------------------

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomUUID(): string {
  const h = randomHex(16);
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    '4' + h.slice(13, 16),
    ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16) + h.slice(17, 20),
    h.slice(20, 32),
  ].join('-');
}

function handleHttpbinIp(request: Request): Response {
  const ip =
    request.headers.get('CF-Connecting-IP') ??
    request.headers.get('X-Forwarded-For') ??
    '0.0.0.0';
  return Response.json({ origin: ip });
}

function handleHttpbinHeaders(request: Request): Response {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  return Response.json({ headers });
}

function handleHttpbinUuid(): Response {
  return Response.json({ uuid: randomUUID() });
}

function handleHttpbinJson(): Response {
  return Response.json({
    slideshow: {
      author: 'Yours Truly',
      date: 'date of publication',
      slides: [
        { title: 'Wake up to WonderWidgets!', type: 'all' },
        {
          items: ['Why <em>WonderWidgets</em> are great', 'Who <em>buys</em> WonderWidgets'],
          title: 'Overview',
          type: 'bullet',
        },
      ],
      title: 'Sample Slide Show',
    },
  });
}

function handleHttpbinStatus(code: number): Response {
  const validCodes = [200, 201, 400, 401, 403, 404, 422, 500, 503];
  const status = validCodes.includes(code) ? code : 200;
  return new Response(null, { status });
}

// ---------------------------------------------------------------------------
// Petstore reverse proxy
// ---------------------------------------------------------------------------

async function handlePetstoreProxy(request: Request, path: string): Promise<Response> {
  // Strip /api/shield/petstore prefix, forward the rest to origin.
  const targetUrl = `${PETSTORE_ORIGIN}${path}`;

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: ['GET', 'HEAD'].includes(request.method) ? null : request.body,
    redirect: 'follow',
  });

  try {
    const response = await fetch(proxyRequest);

    // Build a clean response clone — passing the original Response as init
    // causes the body stream to be consumed twice in some runtimes.
    // Explicitly copying status, statusText, and headers avoids this.
    const clonedHeaders = new Headers(response.headers);
    clonedHeaders.set('Access-Control-Allow-Origin', '*');
    clonedHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    clonedHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

    const proxied = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: clonedHeaders,
    });
    return proxied;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Proxy error';
    return Response.json({ error: `Petstore proxy failed: ${msg}` }, { status: 502 });
  }
}

// ---------------------------------------------------------------------------
// Demo traffic burst — replicates generate_traffic.sh from the wiki guide
// Fires a mix of httpbin + petstore requests with varying auth tokens and
// session cookies so API Shield's session identifier analysis has data.
// ---------------------------------------------------------------------------

interface TrafficResult {
  endpoint: string;
  status: number;
  session: string;
}

async function handleTrafficBurst(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Use POST' }, { status: 405 });
  }

  const results: TrafficResult[] = [];
  const errors: string[] = [];

  // Endpoints to hit — mirrors the schemathesis targets in the wiki guide.
  const httpbinEndpoints = [
    '/api/shield/httpbin/ip',
    '/api/shield/httpbin/headers',
    '/api/shield/httpbin/uuid',
    '/api/shield/httpbin/json',
    '/api/shield/httpbin/status/200',
    '/api/shield/httpbin/status/400',
    '/api/shield/httpbin/status/404',
  ];

  const petstoreEndpoints = [
    '/api/shield/petstore/api/v3/pet/1',
    '/api/shield/petstore/api/v3/pet/2',
    '/api/shield/petstore/api/v3/pet/findByStatus?status=available',
    '/api/shield/petstore/api/v3/store/inventory',
    '/api/shield/petstore/api/v3/user/login?username=test&password=test',
  ];

  const baseUrl = new URL(request.url).origin;

  // Fire 25 requests with rotating session identifiers (matches wiki script).
  const promises: Promise<void>[] = [];
  for (let i = 0; i < 25; i++) {
    const authToken = `Bearer ${randomHex(12)}`;
    const sessionCookie = randomHex(8);
    const useAuth = i % 3 !== 2; // every 3rd request has no session identifier

    // Alternate between httpbin and petstore endpoints.
    const allEndpoints = [...httpbinEndpoints, ...petstoreEndpoints];
    const endpoint = allEndpoints[i % allEndpoints.length];
    const url = `${baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (useAuth) {
      headers['Authorization'] = authToken;
      headers['Cookie'] = `my-session=${sessionCookie}`;
    }

    const p = fetch(url, { method: 'GET', headers })
      .then((res) => {
        results.push({
          endpoint,
          status: res.status,
          session: useAuth ? `auth+cookie` : 'none',
        });
      })
      .catch((err) => {
        errors.push(`${endpoint}: ${err instanceof Error ? err.message : 'failed'}`);
      });

    promises.push(p);
  }

  await Promise.allSettled(promises);

  return Response.json({
    summary: {
      fired: 25,
      succeeded: results.length,
      failed: errors.length,
    },
    results,
    errors,
    note: 'Traffic has been sent to CF edge. Check API Shield → Settings → Session Identifiers to confirm receipt.',
  });
}

// ---------------------------------------------------------------------------
// Main handler — dispatches by sub-path
// ---------------------------------------------------------------------------

export async function handleApiShield(
  request: Request,
  _env: Env
): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      },
    });
  }

  // Include query string so proxy forwards params like ?status=available
  const path = url.pathname + url.search; // e.g. /api/shield/petstore/api/v3/pet/findByStatus?status=available

  // Use pathname only (no query string) for routing decisions
  const pathname = url.pathname;

  // Traffic burst
  if (pathname === '/api/shield/traffic') {
    return handleTrafficBurst(request);
  }

  // Httpbin simulation — no query string needed for these endpoints
  if (pathname.startsWith('/api/shield/httpbin/')) {
    const sub = pathname.replace('/api/shield/httpbin', '');
    if (sub === '/ip')      return handleHttpbinIp(request);
    if (sub === '/headers') return handleHttpbinHeaders(request);
    if (sub === '/uuid')    return handleHttpbinUuid();
    if (sub === '/json')    return handleHttpbinJson();

    const statusMatch = sub.match(/^\/status\/(\d+)$/);
    if (statusMatch) return handleHttpbinStatus(parseInt(statusMatch[1], 10));

    return Response.json({ error: `Unknown httpbin endpoint: ${sub}` }, { status: 404 });
  }

  // Petstore proxy — pass full path including query string
  if (pathname.startsWith('/api/shield/petstore/')) {
    const petstorePath = path.replace('/api/shield/petstore', '');
    return handlePetstoreProxy(request, petstorePath);
  }

  return Response.json({ error: 'Unknown API Shield route' }, { status: 404 });
}
