// src/pages/ApiShieldPage.tsx
//
// API Shield demo page — customer-facing.
// Route: /api-shield
//
// TODO Journey 21: protect this route with Cloudflare Access so only
// authenticated SEs can reach /api-shield from public internet.
// For now: page is live but not linked from any public nav (obscurity only).
//
// Sections:
//   1. Header + scenario framing
//   2. Feature overview (reordered by demo impact)
//   3. Live API Explorer — split: Documented (Petstore) vs Shadow (HTTPBin)
//   4. Traffic Generator — "Simulate Real Mobile App Traffic"
//   5. Resources

import { useState } from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiResponse {
  status: number;
  body: unknown;
  latency: number;
}

interface TrafficSummary {
  fired: number;
  succeeded: number;
  failed: number;
  note: string;
}

// ---------------------------------------------------------------------------
// API Explorer endpoint configs
// ---------------------------------------------------------------------------

const PETSTORE_ENDPOINTS = [
  { label: 'GET /pet/1 — fetch pet by ID', path: '/api/shield/petstore/api/v3/pet/1', method: 'GET' },
  { label: 'GET /pet/findByStatus — available pets', path: '/api/shield/petstore/api/v3/pet/findByStatus?status=available', method: 'GET' },
  { label: 'GET /store/inventory — stock levels', path: '/api/shield/petstore/api/v3/store/inventory', method: 'GET' },
  { label: 'GET /user/login — authenticate user', path: '/api/shield/petstore/api/v3/user/login?username=demo&password=demo', method: 'GET' },
] as const;

const HTTPBIN_ENDPOINTS = [
  { label: 'GET /ip — caller IP address', path: '/api/shield/httpbin/ip', method: 'GET' },
  { label: 'GET /headers — all request headers', path: '/api/shield/httpbin/headers', method: 'GET' },
  { label: 'GET /uuid — random UUID', path: '/api/shield/httpbin/uuid', method: 'GET' },
  { label: 'GET /json — sample JSON payload', path: '/api/shield/httpbin/json', method: 'GET' },
  { label: 'GET /status/200 — HTTP 200 OK', path: '/api/shield/httpbin/status/200', method: 'GET' },
  { label: 'GET /status/404 — HTTP 404 Not Found', path: '/api/shield/httpbin/status/404', method: 'GET' },
  { label: 'GET /status/500 — HTTP 500 Server Error', path: '/api/shield/httpbin/status/500', method: 'GET' },
] as const;

type EndpointConfig = { label: string; path: string; method: string };

// ---------------------------------------------------------------------------
// Features — ordered by demo impact for customer conversations
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: '⚡',
    title: 'Rate Limiting Recommendations',
    desc: 'Cloudflare analyses your actual traffic patterns per endpoint and per user session, then recommends exact rate limit thresholds — derived from real data, not guesses. One click to enforce.',
    pitch: 'No more manually tuning rate limits. CF tells you the right number.',
    tag: 'Powered by session identifiers + 24h traffic',
  },
  {
    icon: '🔗',
    title: 'Sequences',
    desc: 'Your mobile app has a natural call order: login → browse → add to cart → checkout. API Shield learns this sequence from traffic and can block calls that arrive out of order — catching bots and attackers that skip straight to sensitive endpoints.',
    pitch: 'If a bot tries to POST /order without ever calling /login, CF blocks it.',
    tag: 'Up to 10-step sequence memory per session',
  },
  {
    icon: '🔍',
    title: 'API Discovery',
    desc: 'Cloudflare automatically surfaces every API endpoint it sees in traffic — including undocumented "shadow APIs" your team forgot existed. No schema required. You find out what you have before attackers do.',
    pitch: 'HTTPBin below has no schema uploaded. Watch CF discover it anyway.',
    tag: 'Works with zero configuration',
  },
  {
    icon: '📊',
    title: 'Endpoint Management',
    desc: 'Every API endpoint — discovered or schema-uploaded — is listed with method, path, traffic volume, latency percentiles, and error rates. Labels (Normal / Anomalous) are auto-applied after 24h.',
    pitch: 'One view of every API your zone exposes. Fully managed.',
    tag: 'Upload schema → endpoints appear instantly',
  },
  {
    icon: '✅',
    title: 'Schema Validation',
    desc: 'Upload an OpenAPI schema and Cloudflare enforces it at the edge. Requests with wrong field types, missing required parameters, or hitting non-existent paths are blocked before they reach your origin.',
    pitch: 'Petstore\'s schema is uploaded. Try an invalid request — CF catches it.',
    tag: 'Log mode → Block mode → your choice',
  },
  {
    icon: '🔑',
    title: 'Session Identifiers',
    desc: 'Tell Cloudflare which request fields identify a session — Authorization header, session cookie, JWT claim, API key. This powers rate limiting recommendations and sequence detection per individual user.',
    pitch: 'CF knows the difference between User A hammering the API and normal usage.',
    tag: 'Header: authorization • Cookie: my-session',
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({
  emoji,
  title,
  subtitle,
}: {
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2
        style={{
          fontSize: '1.3rem',
          fontWeight: 700,
          margin: '0 0 0.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span>{emoji}</span> {title}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
        {subtitle}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const color =
    status === 0 ? '#6b7280' : status < 300 ? '#10b981' : status < 500 ? '#f59e0b' : '#ef4444';
  return (
    <span
      style={{
        color,
        fontWeight: 600,
        fontSize: '0.85rem',
        padding: '2px 8px',
        background: `${color}22`,
        borderRadius: 4,
      }}
    >
      {status === 0 ? 'ERR' : status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Feature Grid
// ---------------------------------------------------------------------------

function FeatureGrid() {
  return (
    <div className="shield-section">
      <SectionHeader
        emoji="📚"
        title="What API Shield Demonstrates"
        subtitle="Six capabilities — each directly relevant to a mobile app or public API deployment."
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem',
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              padding: '1.1rem',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{ fontSize: '1.4rem' }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{f.title}</div>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.83rem',
                margin: 0,
                lineHeight: 1.6,
                flexGrow: 1,
              }}
            >
              {f.desc}
            </p>
            <div
              style={{
                padding: '0.5rem 0.75rem',
                background: 'rgba(246,130,31,0.06)',
                border: '1px solid rgba(246,130,31,0.2)',
                borderRadius: 6,
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                fontStyle: 'italic',
              }}
            >
              {f.pitch}
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                padding: '2px 8px',
                background: 'rgba(246,130,31,0.1)',
                color: 'var(--primary-orange)',
                borderRadius: 4,
                fontWeight: 600,
                alignSelf: 'flex-start',
              }}
            >
              {f.tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Explorer — shared request/response panel
// ---------------------------------------------------------------------------

function EndpointList({
  endpoints,
  selected,
  onSelect,
}: {
  endpoints: readonly EndpointConfig[];
  selected: EndpointConfig;
  onSelect: (ep: EndpointConfig) => void;
}) {
  return (
    <>
      {endpoints.map((ep) => (
        <button
          key={ep.path}
          type="button"
          className={
            selected.path === ep.path ? 'shield-ep-btn active' : 'shield-ep-btn'
          }
          onClick={() => onSelect(ep)}
          style={{ marginBottom: 4 }}
        >
          <code style={{ fontSize: '0.78rem' }}>{ep.label}</code>
        </button>
      ))}
    </>
  );
}

function ApiExplorer() {
  const [selected, setSelected] = useState<EndpointConfig>(PETSTORE_ENDPOINTS[0]);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [withAuth, setWithAuth] = useState(true);

  const fireRequest = async () => {
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (withAuth) {
        headers['Authorization'] = 'Bearer demo-se-appleflare';
        headers['Cookie'] = 'my-session=demo-appleflare';
      }
      const res = await fetch(selected.path, { method: selected.method, headers });
      const latency = Date.now() - start;
      const ct = res.headers.get('content-type') ?? '';
      const body = ct.includes('application/json') ? await res.json() : await res.text();
      setResponse({ status: res.status, body, latency });
    } catch (err) {
      setResponse({
        status: 0,
        body: { error: err instanceof Error ? err.message : 'Network error' },
        latency: Date.now() - start,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shield-section">
      <SectionHeader
        emoji="🔌"
        title="Live API Explorer"
        subtitle="Fire real requests through the Cloudflare edge. Each one is logged by API Shield — try toggling the auth header to see how session tracking behaves."
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left — endpoint picker */}
        <div>
          {/* Petstore — documented API */}
          <div className="shield-api-group">
            <div className="shield-api-group-label">
              <span className="tag">Schema uploaded</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                Petstore — Documented API
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Endpoints appear in Endpoint Management because we uploaded the OpenAPI schema.
                Schema Validation is active — CF enforces the contract at the edge.
              </span>
            </div>
            <EndpointList
              endpoints={PETSTORE_ENDPOINTS}
              selected={selected}
              onSelect={setSelected}
            />
          </div>

          {/* HTTPBin — shadow API */}
          <div className="shield-api-group" style={{ marginTop: '1rem' }}>
            <div className="shield-api-group-label">
              <span className="tag" style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                No schema — auto-discovered
              </span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                HTTPBin — Shadow API Detection
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No schema was uploaded for HTTPBin. Cloudflare discovers these endpoints
                purely from traffic — exactly how it surfaces your forgotten or undocumented APIs.
              </span>
            </div>
            <EndpointList
              endpoints={HTTPBIN_ENDPOINTS}
              selected={selected}
              onSelect={setSelected}
            />
          </div>
        </div>

        {/* Right — request controls + response */}
        <div>
          <div className="shield-request-box">
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                color: 'var(--primary-orange)',
                marginBottom: '0.75rem',
                wordBreak: 'break-all',
              }}
            >
              {selected.method} {selected.path}
            </div>

            <label className="shield-toggle" style={{ marginBottom: '0.25rem' }}>
              <input
                type="checkbox"
                checked={withAuth}
                onChange={(e) => setWithAuth(e.target.checked)}
              />
              <span>Include Authorization + session cookie</span>
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 0.75rem' }}>
              Toggle off to simulate an unauthenticated request — API Shield tracks
              authenticated and unauthenticated traffic separately.
            </p>

            <button onClick={fireRequest} disabled={loading} style={{ marginBottom: '1rem' }}>
              {loading ? 'Firing...' : '▶  Fire Request'}
            </button>

            {response && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <StatusBadge status={response.status} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {response.latency}ms
                  </span>
                </div>
                <pre className="shield-response-box">
                  {typeof response.body === 'string'
                    ? response.body || '(empty body)'
                    : JSON.stringify(response.body, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Traffic Generator
// ---------------------------------------------------------------------------

function TrafficGenerator() {
  const [status, setStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [summary, setSummary] = useState<TrafficSummary | null>(null);

  const generateTraffic = async () => {
    setStatus('running');
    setSummary(null);
    try {
      const res = await fetch('/api/shield/traffic', { method: 'POST' });
      const data = (await res.json()) as { summary: TrafficSummary };
      setSummary(data.summary);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="shield-section">
      <SectionHeader
        emoji="🚀"
        title="Simulate Real Mobile App Traffic"
        subtitle="Seeds API Shield with realistic request patterns across both APIs — required to activate Rate Limiting Recommendations and Sequence detection."
      />

      {/* SE prep note — styled differently so it reads as an internal note */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          background: 'rgba(245,158,11,0.07)',
          border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 8,
          marginBottom: '1.25rem',
          fontSize: '0.83rem',
          color: '#d97706',
          lineHeight: 1.6,
        }}
      >
        <span style={{ flexShrink: 0 }}>⚠️</span>
        <span>
          <strong>SE Pre-demo prep:</strong> run this traffic burst at least 24 hours before
          the customer meeting, then run it once more on the day. Rate Limiting Recommendations
          and Sequences require two bursts separated by 24h to populate in the CF dashboard.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 0 }}>
            Each burst fires 25 requests simulating real mobile app behaviour:
          </p>
          <ul
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              paddingLeft: '1.25rem',
              lineHeight: 2,
            }}
          >
            <li>Rotating <code>Authorization: Bearer ...</code> tokens per user session</li>
            <li>Rotating <code>Cookie: my-session=...</code> values</li>
            <li>Mix of Petstore and HTTPBin endpoints</li>
            <li>Some requests with <strong>no session identifier</strong> (simulates unauthenticated traffic)</li>
          </ul>

          <button
            onClick={generateTraffic}
            disabled={status === 'running'}
            style={{
              marginTop: '0.75rem',
              backgroundColor:
                status === 'done'
                  ? '#10b981'
                  : status === 'error'
                  ? '#ef4444'
                  : 'var(--primary-orange)',
            }}
          >
            {status === 'idle' && '🚀  Simulate Mobile App Traffic (25 requests)'}
            {status === 'running' && 'Firing requests...'}
            {status === 'done' && '✅  Traffic sent — check CF API Shield dashboard'}
            {status === 'error' && '❌  Error — check Worker logs and retry'}
          </button>
        </div>

        <div>
          {summary && (
            <div className="shield-request-box">
              <p
                style={{ fontWeight: 600, margin: '0 0 0.75rem', color: 'var(--text-main)' }}
              >
                Burst Complete
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '0.5rem',
                  marginBottom: '0.75rem',
                }}
              >
                {[
                  { label: 'Fired', value: summary.fired, color: 'var(--text-main)' },
                  { label: 'OK', value: summary.succeeded, color: '#10b981' },
                  { label: 'Failed', value: summary.failed, color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div
                    key={label}
                    style={{
                      textAlign: 'center',
                      padding: '0.75rem',
                      background: 'var(--bg-color)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {summary.note}
              </p>
            </div>
          )}
          {status === 'error' && (
            <div className="shield-request-box">
              <p style={{ color: '#ef4444', margin: 0 }}>
                Traffic burst failed. Check that the Worker is deployed and petstore tunnel is active.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function ApiShieldPage() {
  return (
    <div className="shield-page">
      <nav>
        <div className="logo">🍎 appleflare.win</div>
        <div className="nav-links">
          <Link
            to="/"
            style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}
          >
            ← Dashboard
          </Link>
        </div>
        <div className="status-badge">
          <div className="dot"></div>
          API Shield Demo
        </div>
      </nav>

      <div className="shield-container">
        {/* Hero */}
        <header style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              margin: '0 0 0.75rem',
              lineHeight: 1.1,
            }}
          >
            Cloudflare{' '}
            <span style={{ color: 'var(--primary-orange)' }}>API Shield</span>
          </h1>

          {/* Customer scenario framing */}
          <div
            style={{
              maxWidth: 680,
              margin: '0 auto 1.5rem',
              padding: '1rem 1.25rem',
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              textAlign: 'left',
            }}
          >
            <p
              style={{
                color: 'var(--text-muted)',
                margin: '0 0 0.5rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.75rem',
              }}
            >
              Customer Scenario
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7 }}>
              Your team ships a mobile app backed by 47 REST API endpoints. Some are documented.
              Some aren't. Your security team has no visibility into who is calling what, at what
              rate, or in what order. This is what Cloudflare API Shield looks like for you —
              deployed in minutes, no code changes, no agents.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              'No SDK required',
              'No code changes',
              'Auto-discovers shadow APIs',
              'Zero-latency enforcement',
            ].map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </header>

        <FeatureGrid />
        <ApiExplorer />
        <TrafficGenerator />

        {/* Resources */}
        <div
          className="shield-section"
          style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}
        >
          <SectionHeader
            emoji="🔗"
            title="Resources"
            subtitle="Reference links for this demo."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              {
                label: 'API Shield Dashboard walkthrough video (April 2025)',
                url: 'https://www.youtube.com/watch?v=dTkKzCRCNPc',
              },
              {
                label: 'Petstore OpenAPI schema — upload this to Endpoint Management',
                url: 'https://petstore.work.appleflare.win/api/v3/openapi.json',
              },
              {
                label: 'Cloudflare API Shield documentation',
                url: 'https://developers.cloudflare.com/api-shield/',
              },
            ].map((r) => (
              <a
                key={r.url}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary-orange)', fontSize: '0.9rem' }}
              >
                ↗ {r.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <footer>
        <p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p>
      </footer>
    </div>
  );
}
