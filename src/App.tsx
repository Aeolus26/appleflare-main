// src/App.tsx
import { useState } from 'react';
import './index.css'; // Make sure this matches your CSS file name
import { Link } from 'react-router-dom';

interface ChatResponse {
  reply?: string;
  model?: string;
  error?: string;
}

function App() {
  // --- Edge Compute card state -----------------------------------------------
  const [responseText, setResponseText] = useState("Ready to test the connection to the Cloudflare Global Edge.");
  const [buttonText, setButtonText] = useState("Ping the Edge Worker");
  const [statusColor, setStatusColor] = useState("var(--text-muted)");
  const [isPinging, setIsPinging] = useState(false);

  // --- AI Insight card state -------------------------------------------------
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState('Ask me anything about this Cloudflare demo.');
  const [aiModel, setAiModel] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const askAI = async () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    setAiLoading(true);
    setAiReply('Thinking at the edge...');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
      });
      const data = (await res.json()) as ChatResponse;
      if (data.reply) {
        setAiReply(data.reply);
        setAiModel(data.model ?? '');
      } else {
        setAiReply(`Error: ${data.error ?? 'unknown'}`);
      }
    } catch {
      setAiReply('Network error talking to the edge brain.');
    } finally {
      setAiLoading(false);
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

        {/* Card 5: AI Insight (Workers AI — Llama 3) */}
        <article className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div className="icon-box">🧠</div>
            AI Insight — Workers AI (Llama 3)
          </div>

          <div
            style={{
              minHeight: '100px',
              maxHeight: '240px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              padding: '12px',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.95rem',
              lineHeight: 1.5,
            }}
          >
            {aiReply}
          </div>

          {aiModel && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px' }}>
              model: <code>{aiModel}</code>
            </p>
          )}

          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="Ask the edge anything..."
            disabled={aiLoading}
            onKeyDown={(e) => { if (e.key === 'Enter') askAI(); }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px',
              marginBottom: '10px',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '8px',
              fontSize: '0.95rem',
            }}
          />

          <button onClick={askAI} disabled={aiLoading || !aiPrompt.trim()}>
            {aiLoading ? 'Inferring at the edge...' : 'Ask the Edge Brain'}
          </button>
        </article>

      </main>

      <footer>
        <p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p>
      </footer>
    </>
  );
}

export default App;