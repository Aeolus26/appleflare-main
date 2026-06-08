// src/cards/CasbCard.tsx
//
// Dashboard card for the CASB demo/explanation page.

import { Link } from 'react-router-dom';

export function CasbCard() {
  return (
    <article className="card">
      <div className="card-header">
        <div className="icon-box">🔎</div>
        CASB — SaaS Security
      </div>

      <p style={{ minHeight: '80px' }}>
        Scan Google Workspace, GitHub, Microsoft 365, Slack and more for
        misconfigurations, exposed data, and stale access — without agents or
        network changes.
      </p>

      <div className="card-tags">
        <span className="tag">SaaS Scanning</span>
        <span className="tag">Shadow IT</span>
        <span className="tag">Data Exposure</span>
        <span className="tag">Access Risk</span>
      </div>

      <div style={{ marginTop: '15px' }}>
        <Link to="/casb">
          <button
            style={{
              width: '100%',
              cursor: 'pointer',
              backgroundColor: 'var(--primary-orange)',
              color: 'white',
              border: 'none',
            }}
          >
            View CASB Findings
          </button>
        </Link>
      </div>
    </article>
  );
}
