// src/pages/CasbPage.tsx
//
// CASB explanation + simulated scan results page.
// Route: /casb
//
// CASB (Cloud Access Security Broker) requires OAuth integration with real
// SaaS tenants to show live data. This page simulates what a real CASB scan
// looks like — same categories, same severity levels, realistic findings.
//
// Use this to explain CASB to a customer and show what it surfaces,
// even without a live enterprise tenant connected.

import { useState } from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface Finding {
  id: string;
  severity: Severity;
  app: string;
  appIcon: string;
  title: string;
  detail: string;
  affected: string;
  recommendation: string;
  category: string;
}

// ---------------------------------------------------------------------------
// Simulated scan findings — realistic for a 500-person company
// ---------------------------------------------------------------------------

const FINDINGS: Finding[] = [
  {
    id: 'f1',
    severity: 'critical',
    app: 'GitHub',
    appIcon: '🐙',
    title: 'AWS access key found in public repository',
    detail: 'File `config/deploy.yml` in repo `acme/backend-infra` contains a hardcoded AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY committed 47 days ago.',
    affected: '1 repo · public · committed by j.smith@acme.com',
    recommendation: 'Rotate the AWS key immediately. Remove from git history using `git filter-branch` or BFG Repo Cleaner. Make the repository private.',
    category: 'Secret Exposure',
  },
  {
    id: 'f2',
    severity: 'critical',
    app: 'Google Drive',
    appIcon: '📁',
    title: '47 files shared publicly via "Anyone with link"',
    detail: 'Files include quarterly financial reports, a board presentation, and a spreadsheet containing 2,847 customer email addresses and phone numbers.',
    affected: '47 files · owned by 12 users · oldest shared 6 months ago',
    recommendation: 'Audit and restrict sharing. Enable Drive DLP policy to prevent public sharing of files matching PII patterns.',
    category: 'Data Exposure',
  },
  {
    id: 'f3',
    severity: 'high',
    app: 'Microsoft 365',
    appIcon: '📘',
    title: 'Former employee account still active with admin privileges',
    detail: '3 accounts belonging to former employees (departed 30-90 days ago) remain active with Global Admin or SharePoint Admin roles.',
    affected: 'r.jones@acme.com · m.tan@acme.com · d.kumar@acme.com',
    recommendation: 'Disable accounts immediately. Audit activity logs for the past 90 days. Revoke all active sessions.',
    category: 'Access Risk',
  },
  {
    id: 'f4',
    severity: 'high',
    app: 'Google Workspace',
    appIcon: '🔵',
    title: '18 users have no MFA enrolled',
    detail: '18 active user accounts have never enrolled a second factor. These accounts are protected only by password, which increases phishing and credential stuffing risk.',
    affected: '18 accounts · mix of engineering and sales roles',
    recommendation: 'Enforce MFA via Google Workspace Admin → Security → Authentication → 2-Step Verification → Enforcement.',
    category: 'Authentication Risk',
  },
  {
    id: 'f5',
    severity: 'high',
    app: 'Slack',
    appIcon: '💬',
    title: 'Message containing credit card number in public channel',
    detail: 'User posted a message in #general-ops containing what appears to be a Visa card number (16-digit pattern matching Luhn algorithm). Message is visible to all 423 workspace members.',
    affected: '#general-ops · posted by a.wong@acme.com · 3 days ago',
    recommendation: 'Delete the message. Notify the user. Enable Slack DLP scanning via CASB to auto-detect and alert on PII in messages.',
    category: 'Data Exposure',
  },
  {
    id: 'f6',
    severity: 'medium',
    app: 'Google Workspace',
    appIcon: '🔵',
    title: 'Third-party OAuth app has full Gmail read/write access',
    detail: '"TaskSync Pro" — an app installed by 34 users — was granted `https://mail.google.com/` scope (full Gmail access). The app has not been used in 4 months.',
    affected: '34 user accounts · last activity 127 days ago',
    recommendation: 'Revoke the OAuth grant for inactive users. Review app necessity. Consider restricting third-party OAuth app installs via Admin policy.',
    category: 'Third-party App Risk',
  },
  {
    id: 'f7',
    severity: 'medium',
    app: 'GitHub',
    appIcon: '🐙',
    title: '12 repositories have branch protection disabled on main',
    detail: 'Direct pushes to the main branch are allowed without review. This bypasses code review and could allow malicious or broken code to reach production.',
    affected: '12 repos · 8 in the `acme` org · 4 in personal accounts',
    recommendation: 'Enable branch protection rules: require PRs, require 1+ approvals, prevent force push.',
    category: 'Configuration Risk',
  },
  {
    id: 'f8',
    severity: 'medium',
    app: 'Microsoft 365',
    appIcon: '📘',
    title: 'External sharing enabled on SharePoint with no expiry',
    detail: '156 SharePoint links shared with external users have no expiration date set. 43 have not been accessed in over 60 days but remain active.',
    affected: '156 external links · oldest created 14 months ago',
    recommendation: 'Set a default expiry policy for external links. Audit and revoke unused links.',
    category: 'Data Exposure',
  },
  {
    id: 'f9',
    severity: 'low',
    app: 'GitHub',
    appIcon: '🐙',
    title: '23 inactive user accounts (90+ days)',
    detail: '23 GitHub org members have not made any commits, comments, or API calls in over 90 days. These may be contractor accounts or former employees.',
    affected: '23 accounts · 8 have write access to production repos',
    recommendation: 'Deprovision or suspend inactive accounts. Implement a quarterly access review.',
    category: 'Stale Access',
  },
  {
    id: 'f10',
    severity: 'low',
    app: 'Slack',
    appIcon: '💬',
    title: '4 external workspace members in internal channels',
    detail: '4 guest accounts (non-acme.com emails) are members of channels marked as internal: #engineering-roadmap and #finance-ops.',
    affected: '4 guests · 2 channels · added 3-8 months ago',
    recommendation: 'Review and remove guest access from sensitive channels. Audit how guests were added.',
    category: 'Access Risk',
  },
];

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; label: string; icon: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Critical', icon: '🔴' },
  high:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'High',     icon: '🟠' },
  medium:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Medium',   icon: '🟡' },
  low:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Low',      icon: '🟢' },
};

const INTEGRATIONS = [
  { name: 'Google Workspace', icon: '🔵', findings: 2, status: 'connected' },
  { name: 'GitHub',           icon: '🐙', findings: 3, status: 'connected' },
  { name: 'Microsoft 365',    icon: '📘', findings: 2, status: 'connected' },
  { name: 'Slack',            icon: '💬', findings: 2, status: 'connected' },
  { name: 'Salesforce',       icon: '☁️', findings: 0, status: 'not_connected' },
  { name: 'Box',              icon: '📦', findings: 0, status: 'not_connected' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: Severity }) {
  const s = SEVERITY_CONFIG[severity];
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
      background: s.bg, color: s.color, borderRadius: 4,
    }}>
      {s.icon} {s.label}
    </span>
  );
}

function SummaryBar() {
  const counts = FINDINGS.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {} as Record<Severity, number>);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      {(['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => {
        const cfg = SEVERITY_CONFIG[s];
        return (
          <div key={s} style={{
            padding: '1rem',
            background: cfg.bg,
            border: `1px solid ${cfg.color}33`,
            borderRadius: 12,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: cfg.color }}>
              {counts[s] ?? 0}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cfg.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IntegrationGrid() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: '0.75rem',
      marginBottom: '1.5rem',
    }}>
      {INTEGRATIONS.map((intg) => (
        <div key={intg.name} style={{
          padding: '0.85rem 1rem',
          background: 'var(--bg-color)',
          border: `1px solid ${intg.status === 'connected' ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}`,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>{intg.icon}</span>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{intg.name}</div>
            {intg.status === 'connected' ? (
              <div style={{ fontSize: '0.72rem', color: '#10b981' }}>
                ✅ {intg.findings} finding{intg.findings !== 1 ? 's' : ''}
              </div>
            ) : (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Not connected</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function FindingCard({ finding }: { finding: Finding }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: 'var(--bg-color)',
      border: `1px solid ${SEVERITY_CONFIG[finding.severity].color}33`,
      borderLeft: `3px solid ${SEVERITY_CONFIG[finding.severity].color}`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div
        style={{ padding: '0.85rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
      >
        <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{finding.appIcon}</span>
        <div style={{ flexGrow: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <SeverityBadge severity={finding.severity} />
            <span style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: 'var(--surface-color)', color: 'var(--text-muted)',
              border: '1px solid var(--border-color)', borderRadius: 4,
            }}>
              {finding.app}
            </span>
            <span style={{
              fontSize: '0.72rem', padding: '2px 7px',
              background: 'rgba(246,130,31,0.08)', color: 'var(--primary-orange)',
              border: '1px solid rgba(246,130,31,0.2)', borderRadius: 4,
            }}>
              {finding.category}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
            {finding.title}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {finding.affected}
          </div>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {expanded && (
        <div style={{
          padding: '0 1rem 1rem 1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.85rem',
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.6 }}>
            {finding.detail}
          </p>
          <div style={{
            padding: '0.65rem 0.9rem',
            background: 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8,
            fontSize: '0.82rem',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#10b981' }}>Recommended action: </strong>
            <span style={{ color: 'var(--text-muted)' }}>{finding.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

export default function CasbPage() {
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [appFilter, setAppFilter] = useState<string>('all');

  const apps = ['all', ...Array.from(new Set(FINDINGS.map(f => f.app)))];
  const filtered = FINDINGS.filter(f =>
    (severityFilter === 'all' || f.severity === severityFilter) &&
    (appFilter === 'all' || f.app === appFilter)
  );

  const totalFindings = FINDINGS.length;
  const criticalCount = FINDINGS.filter(f => f.severity === 'critical').length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav>
        <div className="logo">🍎 appleflare.win</div>
        <div className="nav-links">
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>
            ← Dashboard
          </Link>
        </div>
        <div className="status-badge">
          <div className="dot" style={{ backgroundColor: '#ef4444', boxShadow: '0 0 8px #ef4444' }}></div>
          {criticalCount} Critical
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5% 4rem' }}>

        {/* Hero */}
        <header style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔎</div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', margin: '0 0 0.75rem', lineHeight: 1.1 }}>
            Cloudflare <span style={{ color: 'var(--primary-orange)' }}>CASB</span>
          </h1>

          {/* Scenario */}
          <div style={{
            maxWidth: 680, margin: '0 auto 1.5rem',
            padding: '1rem 1.25rem',
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 12, textAlign: 'left',
          }}>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
              Customer Scenario
            </p>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.7 }}>
              Your 500-person company uses Google Workspace, GitHub, Microsoft 365, and Slack.
              No one has audited SaaS security posture in 12 months. This is what Cloudflare CASB
              found in the first scan — no agents, no network changes, just API access.
            </p>
          </div>

          {/* Simulated badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            padding: '4px 12px',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 20, fontSize: '0.78rem', color: '#d97706', marginBottom: '1rem',
          }}>
            ⚠️ Simulated scan results — for demo purposes
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['No agents required', 'No network changes', 'Continuous scanning', 'Covers 50+ SaaS apps'].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </header>

        {/* What CASB is */}
        <div style={{
          background: 'var(--surface-color)', border: '1px solid var(--border-color)',
          borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem',
        }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>📚 What is CASB?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {[
              { icon: '🔗', title: 'API-based, not inline', desc: 'Connects to SaaS apps via OAuth. No network path changes. Scans your existing data and configs.' },
              { icon: '🔍', title: 'Finds what you forgot', desc: 'Public files, stale access, misconfigured sharing, secrets in code, overprivileged apps. The things that accumulate silently.' },
              { icon: '⚡', title: 'Continuous, not one-shot', desc: 'Scans run automatically. New misconfigurations are surfaced within minutes, not discovered months later in a breach report.' },
              { icon: '🔧', title: 'Actionable, not just alerts', desc: 'Every finding includes a recommended action. Many can be remediated directly from the CASB dashboard with one click.' },
            ].map(f => (
              <div key={f.title} style={{ padding: '0.85rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.3rem' }}>{f.title}</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Connected integrations */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>🔌 Connected Integrations</h2>
          <IntegrationGrid />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Salesforce and Box are not yet connected. Connect via Zero Trust → CASB → Integrations → Authorise with OAuth.
          </p>
        </div>

        {/* Findings */}
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>🚨 Findings — {totalFindings} total</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                Click any finding to expand details and recommended action.
              </p>
            </div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverityFilter(s)}
                    style={{
                      width: 'auto', padding: '3px 10px', fontSize: '0.75rem', textTransform: 'capitalize',
                      backgroundColor: severityFilter === s ? (s === 'all' ? 'var(--primary-orange)' : SEVERITY_CONFIG[s]?.color ?? 'var(--primary-orange)') : 'transparent',
                      color: severityFilter === s ? (s === 'all' ? '#000' : '#000') : 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                style={{
                  background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                  color: 'var(--text-main)', borderRadius: 6, padding: '4px 8px', fontSize: '0.78rem',
                }}
              >
                {apps.map(a => <option key={a} value={a}>{a === 'all' ? 'All apps' : a}</option>)}
              </select>
            </div>
          </div>

          <SummaryBar />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No findings match the filter.</p>
            ) : (
              filtered.map(f => <FindingCard key={f.id} finding={f} />)
            )}
          </div>
        </div>

        {/* How to connect a real integration */}
        <div style={{
          marginTop: '1.5rem', background: 'var(--surface-color)',
          border: '1px solid var(--border-color)', borderRadius: 16, padding: '1.5rem',
        }}>
          <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>🔗 How to connect a real integration</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
            {[
              { step: '1', title: 'Go to Zero Trust → CASB → Integrations', detail: 'Click "Add integration" and select your SaaS app (Google Workspace, GitHub, etc.)' },
              { step: '2', title: 'Authorise with OAuth', detail: 'CF requests read-only API access to your SaaS tenant. No credentials are stored — OAuth tokens only.' },
              { step: '3', title: 'First scan runs within minutes', detail: 'CF scans all files, users, apps, and settings. Initial results appear on the Findings page.' },
              { step: '4', title: 'Continuous scanning from here', detail: 'New misconfigurations surface automatically. Severity-based alerts can be sent to Slack, email, or PagerDuty.' },
            ].map(s => (
              <div key={s.step} style={{ display: 'flex', gap: '0.75rem', padding: '0.85rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'var(--primary-orange)',
                  color: '#000', fontWeight: 800, fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {s.step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{s.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>{s.detail}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '1rem', padding: '0.75rem 1rem',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-muted)',
          }}>
            💡 <strong style={{ color: '#10b981' }}>Free demo tip:</strong> A free Google Workspace trial account + CASB OAuth integration
            gives you real live findings within minutes — even a new workspace will surface
            "MFA not enforced" and "legacy app access enabled". Zero cost, real data.
          </div>
        </div>
      </div>

      <footer>
        <p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p>
      </footer>
    </div>
  );
}
