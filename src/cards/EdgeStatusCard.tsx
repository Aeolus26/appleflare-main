// src/cards/EdgeStatusCard.tsx
//
// Card 1 — Edge Compute Status
// Pings /api/hello and displays the geo-aware response from the edge worker.
//
// Self-contained: owns its own state, has no props.

import { useState } from 'react';

export function EdgeStatusCard() {
  const [responseText, setResponseText] = useState(
    'Ready to test the connection to the Cloudflare Global Edge.'
  );
  const [buttonText, setButtonText] = useState('Ping the Edge Worker');
  const [statusColor, setStatusColor] = useState('var(--text-muted)');
  const [isPinging, setIsPinging] = useState(false);

  const pingEdge = async () => {
    setIsPinging(true);
    setButtonText('Executing Request...');
    setStatusColor('var(--text-muted)');

    try {
      const response = await fetch('/api/hello');
      const data = await response.text();

      setResponseText('Response received: ' + data);
      setStatusColor('#10b981'); // success green
    } catch {
      setResponseText('Network Error: Cannot reach the Edge Worker.');
      setStatusColor('#ef4444'); // error red
    } finally {
      setButtonText('Ping the Edge Worker');
      setIsPinging(false);
    }
  };

  return (
    <article
      className="card"
      style={{
        borderColor: 'var(--primary-orange)',
        boxShadow: '0 0 20px var(--primary-glow)',
      }}
    >
      <div className="card-header">
        <div className="icon-box">⚡</div>
        Edge Compute Status
      </div>
      <p style={{ color: statusColor }}>{responseText}</p>
      <button onClick={pingEdge} disabled={isPinging}>
        {buttonText}
      </button>
    </article>
  );
}
