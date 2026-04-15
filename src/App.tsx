// src/App.tsx
import { useState } from 'react';
import './index.css'; // Make sure this matches your CSS file name
import { Link } from 'react-router-dom';

function App() {
  // These are State variables. When we update them, the UI updates instantly!
  const [responseText, setResponseText] = useState("Ready to test the connection to the Cloudflare Global Edge.");
  const [buttonText, setButtonText] = useState("Ping the Edge Worker");
  const [statusColor, setStatusColor] = useState("var(--text-muted)");
  const [isPinging, setIsPinging] = useState(false);

  const pingEdge = async () => {
    setIsPinging(true);
    setButtonText("Executing Request...");
    setStatusColor("var(--text-muted)");

    try {
      const response = await fetch('/api/hello');
      const data = await response.text();
      
      setResponseText("Response received: " + data);
      setStatusColor("#10b981"); // Success green
    } catch (error) {
      setResponseText("Network Error: Cannot reach the Edge Worker.");
      setStatusColor("#ef4444"); // Error red
    } finally {
      setButtonText("Ping the Edge Worker");
      setIsPinging(false);
    }
  };

  return (
    <>
      <nav>
        <div className="logo">🍎 appleflare.win</div>
        <div className="nav-links">
          <a href="#" className="active">Overview</a>
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
        <h1>Edge Solutions <span>Interactive Lab</span></h1>
        <p className="hero-subtitle">A live demonstration environment showcasing the full Cloudflare stack. Built for real-world customer scenarios.</p>
      </header>

      <main className="dashboard-grid">
        {/* Card 1: Worker Status */}
        <article className="card" style={{ borderColor: 'var(--primary-orange)', boxShadow: '0 0 20px var(--primary-glow)' }}>
          <div className="card-header">
            <div className="icon-box">⚡</div>
            Edge Compute Status
          </div>
          <p style={{ color: statusColor }}>{responseText}</p>
          <button onClick={pingEdge} disabled={isPinging}>
            {buttonText}
          </button>
        </article>

        {/* Card 2: Object Storage */}
        <article className="card">
          <div className="card-header">
            <div className="icon-box">📦</div>
            R2 Object Vault
          </div>
          <p>Zero-egress object storage for global media delivery. Service binding currently offline.</p>
          <button className="secondary" disabled>Initialize Bucket</button>
        </article>

        {/* Card 3: Database */}
        <article className="card">
          <div className="card-header">
            <div className="icon-box">🗄️</div>
            D1 Relational Data
          </div>
          <p>Strictly consistent SQLite database operating at the edge. Awaiting schema deployment.</p>
          <button className="secondary" disabled>View Logs</button>
        </article>

        {/* Card 4: Turnstile Gateway */}
        <article className="card">
          <div className="card-header">
            <div className="icon-box">🛡️</div>
            Turnstile Security Testing
          </div>
          
          <p style={{ minHeight: '60px', marginTop: '10px' }}>
            Test the Cloudflare application-layer security. This will redirect you to the dedicated secure authentication route.
          </p>
          
          {/* This Link wraps the button and handles the instant SPA routing! */}
          <div style={{ marginTop: '15px' }}>
            <Link to="/login">
              <button style={{ width: '100%', cursor: 'pointer', backgroundColor: 'var(--primary-orange)', color: 'white', border: 'none' }}>
                Go to Secure Login Demo
              </button>
            </Link>
          </div>
        </article>

      </main>

      <footer>
        <p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p>
      </footer>
    </>
  );
}

export default App;