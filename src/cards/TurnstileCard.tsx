// src/cards/TurnstileCard.tsx
//
// Card 4 — Turnstile Security Testing
// Links to the dedicated /login route which mounts the Turnstile widget
// and validates against the appleflare-turnstile-auth Worker.

import { Link } from 'react-router-dom';

export function TurnstileCard() {
  return (
    <article className="card">
      <div className="card-header">
        <div className="icon-box">🛡️</div>
        Turnstile Security Testing
      </div>

      <p style={{ minHeight: '60px', marginTop: '10px' }}>
        Test the Cloudflare application-layer security. This will redirect you
        to the dedicated secure authentication route.
      </p>

      <div style={{ marginTop: '15px' }}>
        <Link to="/login">
          <button
            style={{
              width: '100%',
              cursor: 'pointer',
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
            }}
          >
            Go to Secure Login Demo
          </button>
        </Link>
      </div>
    </article>
  );
}
