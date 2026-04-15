import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

// This contract tells TypeScript exactly what shape the API data will be
interface AuthResponse {
  success: boolean;
  message: string;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!turnstileToken) {
      setMessage("Please complete the Turnstile challenge.");
      return;
    }

    setMessage("Verifying with API...");

    try {
      const response = await fetch('https://appleflare-turnstile-auth.kaifoong-s-lab.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          token: turnstileToken
        })
      });

      // The magic TypeScript fix is right here:
      const data = (await response.json()) as AuthResponse;

      if (data.success) {
        setMessage("✅ Login Successful!");
      } else {
        setMessage("❌ Failed: " + data.message);
      }
    } catch (error) {
      setMessage("❌ Error connecting to API.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '300px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Security Demo</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" 
          placeholder="Test Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
          style={{ padding: '8px' }}
        />
        
        <input 
          type="password" 
          placeholder="Test Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '8px' }}
        />

        <Turnstile 
          siteKey="0x4AAAAAAC9RFcJvy9WOY-Hb" 
          onSuccess={(token) => setTurnstileToken(token)}
        />

        <button type="submit" style={{ padding: '10px', cursor: 'pointer' }}>Test Turnstile</button>
      </form>
      
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}