// src/cards/D1DataCard.tsx
//
// Card 3 — D1 Relational Data (placeholder for now)
// Will be expanded in a future Journey to read/write live D1 records.

export function D1DataCard() {
  return (
    <article className="card">
      <div className="card-header">
        <div className="icon-box">🗄️</div>
        D1 Relational Data
      </div>
      <p>
        Strictly consistent SQLite database operating at the edge. Awaiting
        schema deployment.
      </p>
      <button className="secondary" disabled>
        View Logs
      </button>
    </article>
  );
}
