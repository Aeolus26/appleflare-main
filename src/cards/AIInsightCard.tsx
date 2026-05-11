// src/cards/AIInsightCard.tsx
//
// Card 5 — AI Insight (Workers AI — Llama 3)
// Sends user prompt to /api/chat and renders the model's reply.
//
// Self-contained: owns prompt, reply, model name, and loading state.
// Backend contract: POST /api/chat { message: string } -> { reply, model } | { error }

import { useState } from 'react';

interface ChatResponse {
  reply?: string;
  model?: string;
  error?: string;
}

export function AIInsightCard() {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiReply, setAiReply] = useState(
    'Ask me anything about this Cloudflare demo.'
  );
  const [aiModel, setAiModel] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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
        <p
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            marginTop: '-8px',
          }}
        >
          model: <code>{aiModel}</code>
        </p>
      )}

      <input
        type="text"
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        placeholder="Ask the edge anything..."
        disabled={aiLoading}
        onKeyDown={(e) => {
          if (e.key === 'Enter') askAI();
        }}
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
  );
}
