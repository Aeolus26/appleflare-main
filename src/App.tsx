// src/App.tsx
import { useState } from 'react';
import './index.css'; // Make sure this matches your CSS file name
import { Turnstile } from '@marsidev/react-turnstile';

// The TypeScript contract for your Backend Worker
interface AuthResponse {
  success: boolean;
  message: string;
}

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

    // --- TURNSTILE STATE VARIABLES ---
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResponseText, setTurnstileResponseText] = useState('Awaiting Turnstile challenge...');
  const [turnstileStatusColor, setTurnstileStatusColor] = useState('gray');
  const [isVerifying, setIsVerifying] = useState(false);

  // --- TURNSTILE API FUNCTION ---
  const testTurnstile = async () => {
    if (!turnstileToken) return;

    setIsVerifying(true);
    setTurnstileResponseText("Verifying token with Backend Worker...");
    setTurnstileStatusColor("blue");

    try {
      const response = await fetch('https://api.work.appleflare.win/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: "demo_user", 
          password: "demo_password", 
          token: turnstileToken 
        })
      });

      // The TypeScript magic fix:
      const data = (await response.json()) as AuthResponse;

      if (data.success) {
        setTurnstileResponseText("✅ Human Verified! API connection successful.");
        setTurnstileStatusColor("green");
      } else {
        setTurnstileResponseText("❌ Bot Detected: " + data.message);
        setTurnstileStatusColor("red");
      }
    } catch (error) {
      setTurnstileResponseText("❌ Network Error connecting to API Worker.");
      setTurnstileStatusColor("red");
    } finally {
      setIsVerifying(false);
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

        {/* Card 4: Turnstile Demo */}
        <article className="card">
          <div className="card-header">
            <div className="icon-box">🛡️</div>
            Turnstile Security Testing
          </div>
          
          {/* The actual Turnstile Widget */}
          <div style={{ margin: '15px 0', display: 'flex', justifyContent: 'center' }}>
            <Turnstile 
              siteKey="YOUR_PUBLIC_SITEKEY_HERE" 
              onSuccess={(token) => {
                setTurnstileToken(token);
                setTurnstileResponseText("Token generated. Ready to verify!");
                setTurnstileStatusColor("green");
              }}
            />
          </div>

          {/* The Status Text */}
          <p style={{ color: turnstileStatusColor, fontSize: '0.9rem', minHeight: '40px' }}>
            {turnstileResponseText}
          </p>
          
          {/* The Action Button */}
          <button 
            onClick={testTurnstile} 
            disabled={isVerifying || !turnstileToken}
            style={{ width: '100%', cursor: (!turnstileToken || isVerifying) ? 'not-allowed' : 'pointer' }}
          >
            {isVerifying ? "Verifying..." : "Ping Secure Edge"}
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