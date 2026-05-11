// src/App.tsx
//
// Dashboard shell.
// Owns: navigation, hero, footer, card visibility, layout grid.
// Delegates: each card to its own component in src/cards/.

import './index.css';
import { EdgeStatusCard } from './cards/EdgeStatusCard';
import { R2VaultCard } from './cards/R2VaultCard';
import { D1DataCard } from './cards/D1DataCard';
import { TurnstileCard } from './cards/TurnstileCard';
import { AIInsightCard } from './cards/AIInsightCard';
import { ApiShieldCard } from './cards/ApiShieldCard';
import { useCardVisibility, CARD_DEFINITIONS } from './hooks/useCardVisibility';

function App() {
  const { visible, toggle, showAll, hideAll } = useCardVisibility();

  return (
    <>
      <nav>
        <div className="logo">🍎 appleflare.win</div>
        <div className="nav-links">
          <a href="#" className="active">
            Overview
          </a>
          <a href="#">Storage & Media</a>
          <a href="#">Security & AI</a>
          <a href="#">About</a>
        </div>
        <div className="status-badge">
          <div className="dot"></div>
          Edge Online
        </div>
      </nav>

      <header className="hero">
        <h1>
          Edge Solutions <span>Interactive Lab</span>
        </h1>
        <p className="hero-subtitle">
          A live demonstration environment showcasing the full Cloudflare stack.
          Built for real-world customer scenarios.
        </p>
      </header>

      {/* Card visibility toggles ------------------------------------------- */}
      <section className="card-toggles" aria-label="Show or hide cards">
        <div className="card-toggles__header">
          <strong>Visible cards:</strong>
          <div className="card-toggles__bulk">
            <button type="button" className="secondary" onClick={showAll}>
              Show all
            </button>
            <button type="button" className="secondary" onClick={hideAll}>
              Hide all
            </button>
          </div>
        </div>
        <div className="card-toggles__list">
          {CARD_DEFINITIONS.map((card) => (
            <label key={card.id} className="card-toggles__item">
              <input
                type="checkbox"
                checked={visible[card.id]}
                onChange={() => toggle(card.id)}
              />
              <span>{card.label}</span>
            </label>
          ))}
        </div>
      </section>

      <main className="dashboard-grid">
        {visible.edge && <EdgeStatusCard />}
        {visible.r2 && <R2VaultCard />}
        {visible.d1 && <D1DataCard />}
        {visible.turnstile && <TurnstileCard />}
        {visible.ai && <AIInsightCard />}
        {visible.apishield && <ApiShieldCard />}
      </main>

      <footer>
        <p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p>
      </footer>
    </>
  );
}

export default App;
