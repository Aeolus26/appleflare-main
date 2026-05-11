// src/cards/ApiShieldCard.tsx
//
// Dashboard card for the API Shield demo.
// Clicking navigates to the full /api-shield demo page.
//
// Target audience: SE demo to customers building mobile apps / public APIs.

import { Link } from 'react-router-dom';

export function ApiShieldCard() {
  return (
    <article className="card">
      <div className="card-header">
        <div className="icon-box">🛡️</div>
        API Shield
      </div>

      <p style={{ minHeight: '80px' }}>
        Discover, protect, and monitor your APIs at the edge. Live demo of
        Endpoint Management, Schema Validation, API Discovery, Rate Limiting
        Recommendations, and Sequences.
      </p>

      <div className="card-tags">
        <span className="tag">Endpoint Mgmt</span>
        <span className="tag">Schema Validation</span>
        <span className="tag">Discovery</span>
        <span className="tag">Rate Limiting</span>
      </div>

      <div style={{ marginTop: '15px' }}>
        <Link to="/api-shield">
          <button
            style={{
              width: '100%',
              cursor: 'pointer',
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
            }}
          >
            Launch API Shield Demo
          </button>
        </Link>
      </div>
    </article>
  );
}
