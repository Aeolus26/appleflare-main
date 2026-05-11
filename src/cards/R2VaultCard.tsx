// src/cards/R2VaultCard.tsx
//
// Card 2 — R2 Object Vault (placeholder)
// Will be activated in Journey 16 (R2 Storage).

export function R2VaultCard() {
  return (
    <article className="card">
      <div className="card-header">
        <div className="icon-box">📦</div>
        R2 Object Vault
      </div>
      <p>
        Zero-egress object storage for global media delivery. Service binding
        currently offline.
      </p>
      <button className="secondary" disabled>
        Initialize Bucket
      </button>
    </article>
  );
}
