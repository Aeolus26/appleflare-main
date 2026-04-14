import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';

// 1. We create a contract telling TypeScript exactly what our API returns
interface AuthResponse {
  success: boolean;
  message: string;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // This state will hold the secret Token that Turnstile generates!
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
      // We send the React state to our completely separate Backend Worker
      const response = await fetch('https://api.work.appleflare.win/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password,
          token: turnstileToken
        })
      });

      const data = await response.json();

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
    <div style={{ padding: '40px', maxWidth: '300px', margin: '0 auto' }}>
      <h2>Secure Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" 
          placeholder="Username" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />

        {/* THE TURNSTILE REACT COMPONENT */}
        <Turnstile 
          siteKey="0x4AAAAAAC9RFZIpj0nZz4FY9D-gMbrX8k8" 
          onSuccess={(token) => setTurnstileToken(token)}
        />

        <button type="submit">Log In</button>
      </form>
      
      {message && <p style={{ marginTop: '20px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}