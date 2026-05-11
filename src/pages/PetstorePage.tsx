// src/pages/PetstorePage.tsx
//
// Visual petstore storefront with cart + checkout — route: /petstore
//
// Every API call flows through Worker proxy /api/shield/petstore/* → CF edge →
// petstore.work.appleflare.win. API Shield logs the full purchase sequence:
//   1. GET /user/login          (authenticate)
//   2. GET /pet/findByStatus    (browse catalogue)
//   3. GET /pet/{id}            (view product detail)
//   4. POST /store/order        (place order)
//   5. GET /store/order/{id}    (confirm order)
//
// NOTE: If Cloudflare Access is protecting www.work.appleflare.win, add a
// Bypass rule for /api/shield/* in Zero Trust → Access → Applications.

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// ---------------------------------------------------------------------------
// API base — all calls go through the Worker proxy
// ---------------------------------------------------------------------------

const API = '/api/shield/petstore/api/v3';

const AUTH_HEADERS = {
  Authorization: 'Bearer demo-se-appleflare',
  Cookie: 'my-session=demo-appleflare',
  'Content-Type': 'application/json',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Pet {
  id: number;
  name: string;
  status: 'available' | 'pending' | 'sold';
  category?: { id: number; name: string };
  tags?: { id: number; name: string }[];
  photoUrls?: string[];
}

interface OrderPayload {
  id: number;
  petId: number;
  quantity: number;
  status: string;
  complete: boolean;
}

interface CartItem {
  pet: Pet;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Prices — petstore API has no prices, so we assign by category
// ---------------------------------------------------------------------------

const CATEGORY_PRICE: Record<string, number> = {
  Dogs: 299,
  Cats: 199,
  Lions: 1299,
  Rabbits: 89,
  Birds: 149,
  Fish: 49,
  default: 99,
};

function priceFor(pet: Pet): number {
  return CATEGORY_PRICE[pet.category?.name ?? ''] ?? CATEGORY_PRICE.default;
}

const CATEGORY_EMOJI: Record<string, string> = {
  Dogs: '🐕', Cats: '🐈', Lions: '🦁', Rabbits: '🐇',
  Birds: '🦜', Fish: '🐟', default: '🐾',
};

function catEmoji(name?: string) {
  return CATEGORY_EMOJI[name ?? ''] ?? CATEGORY_EMOJI.default;
}

// ---------------------------------------------------------------------------
// Shared fetch helper — detects Access redirect (returns HTML instead of JSON)
// ---------------------------------------------------------------------------

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { ...AUTH_HEADERS, ...(options?.headers ?? {}) },
  });
  // Access redirects return HTML — catch early and surface a clear error
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok && !ct.includes('application/json') && !ct.includes('text/plain')) {
    throw new Error(
      `Access policy blocked this request (HTTP ${res.status}). ` +
      `Add a Bypass rule for /api/shield/* in CF Zero Trust → Access → Applications.`
    );
  }
  return res;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    available: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    pending:   { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    sold:      { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
    placed:    { bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
    approved:  { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    delivered: { bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
  };
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' };
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
      background: s.bg, color: s.color, borderRadius: 4, textTransform: 'capitalize',
    }}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pet detail modal
// ---------------------------------------------------------------------------

function PetModal({
  pet,
  onClose,
  onAddToCart,
  cartQty,
}: {
  pet: Pet;
  onClose: () => void;
  onAddToCart: (pet: Pet) => void;
  cartQty: number;
}) {
  const price = priceFor(pet);
  return (
    <div className="petstore-modal-backdrop" onClick={onClose}>
      <div className="petstore-modal" onClick={(e) => e.stopPropagation()}>
        <button className="petstore-modal__close" onClick={onClose}>✕</button>
        <div style={{ fontSize: '4rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {catEmoji(pet.category?.name)}
        </div>
        <h2 style={{ margin: '0 0 0.25rem', textAlign: 'center' }}>{pet.name}</h2>
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <StatusBadge status={pet.status} />
        </div>
        <div style={{
          fontSize: '2rem', fontWeight: 800, textAlign: 'center',
          color: 'var(--primary-orange)', marginBottom: '1rem',
        }}>
          ${price.toLocaleString()}
        </div>

        <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', marginBottom: '1.25rem' }}>
          <tbody>
            {[
              ['Category', pet.category?.name ?? '—'],
              ['Tags', pet.tags?.map(t => t.name).join(', ') || '—'],
              ['Pet ID', pet.id],
            ].map(([label, value]) => (
              <tr key={String(label)} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '0.5rem', color: 'var(--text-muted)', width: '35%' }}>{label}</td>
                <td style={{ padding: '0.5rem' }}>{String(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {pet.status === 'available' ? (
          <button
            onClick={() => { onAddToCart(pet); onClose(); }}
            style={{ background: cartQty > 0 ? '#10b981' : 'var(--primary-orange)' }}
          >
            {cartQty > 0 ? `✅ In Cart (${cartQty}) — Add Another` : '🛒 Add to Cart'}
          </button>
        ) : (
          <button disabled>Not Available</button>
        )}

        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
          API Shield logged: <code>GET /pet/{pet.id}</code> as sequence step 3
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart sidebar
// ---------------------------------------------------------------------------

function CartSidebar({
  items,
  onRemove,
  onQtyChange,
  onCheckout,
  onClose,
}: {
  items: CartItem[];
  onRemove: (id: number) => void;
  onQtyChange: (id: number, qty: number) => void;
  onCheckout: () => void;
  onClose: () => void;
}) {
  const total = items.reduce((sum, i) => sum + priceFor(i.pet) * i.quantity, 0);

  return (
    <div className="petstore-modal-backdrop" onClick={onClose}>
      <div
        className="petstore-modal"
        style={{ maxWidth: 420, marginLeft: 'auto', marginRight: 0, borderRadius: '16px 0 0 16px', maxHeight: '100vh', borderRight: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="petstore-modal__close" onClick={onClose}>✕</button>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>🛒 Your Cart</h2>

        {items.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            Cart is empty
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {items.map((item) => (
                <div key={item.pet.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem', background: 'var(--bg-color)',
                  border: '1px solid var(--border-color)', borderRadius: 10,
                }}>
                  <span style={{ fontSize: '2rem' }}>{catEmoji(item.pet.category?.name)}</span>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.pet.name}
                    </div>
                    <div style={{ color: 'var(--primary-orange)', fontWeight: 700, fontSize: '0.85rem' }}>
                      ${priceFor(item.pet).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => onQtyChange(item.pet.id, item.quantity - 1)}
                      style={{ width: 28, padding: '2px', fontSize: '1rem', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    >−</button>
                    <span style={{ minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => onQtyChange(item.pet.id, item.quantity + 1)}
                      style={{ width: 28, padding: '2px', fontSize: '1rem', background: 'var(--surface-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
                    >+</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.pet.id)}
                    style={{ width: 28, padding: '2px', fontSize: '0.9rem', background: 'transparent', color: '#ef4444', border: 'none' }}
                  >✕</button>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1rem',
            }}>
              <span style={{ fontWeight: 600 }}>Total</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-orange)' }}>
                ${total.toLocaleString()}
              </span>
            </div>

            <button onClick={onCheckout}>
              Proceed to Checkout →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout + payment form
// ---------------------------------------------------------------------------

type CheckoutStep = 'form' | 'processing' | 'success';

interface OrderResult {
  order: OrderPayload;
  confirmation: OrderPayload;
}

function CheckoutPage({
  items,
  onBack,
  onDone,
}: {
  items: CartItem[];
  onBack: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<CheckoutStep>('form');
  const [result, setResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', address: '', city: '', card: '', expiry: '', cvv: '',
  });

  const total = items.reduce((sum, i) => sum + priceFor(i.pet) * i.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const placeOrder = async () => {
    setStep('processing');
    setError('');
    try {
      // Place one order per cart item — API Shield logs each POST /store/order (step 4)
      const orders: OrderPayload[] = [];
      for (const item of items) {
        const res = await apiFetch('/store/order', {
          method: 'POST',
          body: JSON.stringify({
            id: Math.floor(Math.random() * 100000),
            petId: item.pet.id,
            quantity: item.quantity,
            status: 'placed',
            complete: false,
          }),
        });
        const order = (await res.json()) as OrderPayload;
        orders.push(order);
      }

      // Confirm first order — GET /store/order/{id} (step 5)
      const confirmRes = await apiFetch(`/store/order/${orders[0].id}`);
      const confirmation = (await confirmRes.json()) as OrderPayload;

      setResult({ order: orders[0], confirmation });
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
      setStep('form');
    }
  };

  if (step === 'success' && result) {
    return (
      <div style={{ maxWidth: 540, margin: '4rem auto', textAlign: 'center', padding: '0 5%' }}>
        <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🎉</div>
        <h1 style={{ margin: '0 0 0.5rem' }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Your pets are on their way.
        </p>

        <div style={{
          background: 'var(--surface-color)', border: '1px solid var(--border-color)',
          borderRadius: 16, padding: '1.5rem', textAlign: 'left', marginBottom: '1.5rem',
        }}>
          <div style={{ fontWeight: 700, marginBottom: '0.75rem' }}>Order Summary</div>
          {items.map(item => (
            <div key={item.pet.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)',
              fontSize: '0.9rem',
            }}>
              <span>{catEmoji(item.pet.category?.name)} {item.pet.name} × {item.quantity}</span>
              <span style={{ color: 'var(--primary-orange)', fontWeight: 700 }}>
                ${(priceFor(item.pet) * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', fontWeight: 800, fontSize: '1.1rem' }}>
            <span>Total Paid</span>
            <span style={{ color: 'var(--primary-orange)' }}>${total.toLocaleString()}</span>
          </div>
        </div>

        <div style={{
          background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10, padding: '0.75rem 1rem', fontSize: '0.8rem',
          color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'left',
        }}>
          <div style={{ fontWeight: 700, color: '#10b981', marginBottom: '0.4rem' }}>
            🛡️ API Shield logged this purchase sequence:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {[
              'Step 1: GET /user/login',
              'Step 2: GET /pet/findByStatus',
              'Step 3: GET /pet/{id}',
              `Step 4: POST /store/order (order #${result.order.id})`,
              `Step 5: GET /store/order/${result.order.id} → status: ${result.confirmation.status}`,
            ].map(s => <code key={s} style={{ fontSize: '0.75rem' }}>{s}</code>)}
          </div>
        </div>

        <button onClick={onDone}>← Back to Store</button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div style={{ textAlign: 'center', padding: '6rem 5%' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
        <p style={{ color: 'var(--text-muted)' }}>
          Placing order via <code>POST /store/order</code>…
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          API Shield is logging this as sequence step 4
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 620, margin: '0 auto', padding: '2rem 5% 4rem' }}>
      <button
        type="button"
        onClick={onBack}
        style={{ width: 'auto', padding: '6px 14px', marginBottom: '1.5rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
      >
        ← Back to cart
      </button>

      <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.4rem' }}>Checkout</h1>

      {error && (
        <div style={{
          padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
          color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem',
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left — form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="petstore-section" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Contact
            </div>
            {[
              { name: 'name', label: 'Full name', placeholder: 'Jane Smith' },
              { name: 'email', label: 'Email', placeholder: 'jane@example.com' },
              { name: 'address', label: 'Address', placeholder: '123 Main St' },
              { name: 'city', label: 'City', placeholder: 'Singapore' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {f.label}
                </label>
                <input
                  name={f.name}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                    background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', borderRadius: 8, fontSize: '0.88rem',
                  }}
                />
              </div>
            ))}
          </div>

          <div className="petstore-section" style={{ padding: '1.25rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Payment
            </div>
            {[
              { name: 'card', label: 'Card number', placeholder: '4242 4242 4242 4242' },
              { name: 'expiry', label: 'Expiry', placeholder: 'MM/YY' },
              { name: 'cvv', label: 'CVV', placeholder: '123' },
            ].map(f => (
              <div key={f.name} style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {f.label}
                </label>
                <input
                  name={f.name}
                  value={form[f.name as keyof typeof form]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 10px',
                    background: 'var(--bg-color)', border: '1px solid var(--border-color)',
                    color: 'var(--text-main)', borderRadius: 8, fontSize: '0.88rem',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right — order summary */}
        <div>
          <div className="petstore-section" style={{ padding: '1.25rem', position: 'sticky', top: '80px' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              Order Summary
            </div>
            {items.map(item => (
              <div key={item.pet.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)',
                fontSize: '0.85rem', gap: '0.5rem',
              }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  {catEmoji(item.pet.category?.name)} {item.pet.name} × {item.quantity}
                </span>
                <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  ${(priceFor(item.pet) * item.quantity).toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              paddingTop: '0.75rem', fontWeight: 800, fontSize: '1rem',
            }}>
              <span>Total</span>
              <span style={{ color: 'var(--primary-orange)' }}>${total.toLocaleString()}</span>
            </div>

            <button onClick={placeOrder} style={{ marginTop: '1rem' }}>
              Pay ${total.toLocaleString()} →
            </button>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0 0' }}>
              Demo only — no real payment processed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pet catalogue
// ---------------------------------------------------------------------------

function PetCatalogue({
  cart,
  onAddToCart,
}: {
  cart: CartItem[];
  onAddToCart: (pet: Pet) => void;
}) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'available' | 'pending' | 'sold'>('available');
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch(`/pet/findByStatus?status=${filter}`)
      .then((r) => r.json())
      .then((data) => { setPets(data as Pet[]); setLoading(false); })
      .catch((e: Error) => { setError(e.message); setLoading(false); });
  }, [filter]);

  const cartQty = (petId: number) =>
    cart.find(i => i.pet.id === petId)?.quantity ?? 0;

  return (
    <div className="petstore-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>🐾 Pet Catalogue</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
            Click any pet to view details and add to cart · <code>GET /pet/findByStatus</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {(['available', 'pending', 'sold'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                width: 'auto', padding: '4px 14px', fontSize: '0.8rem', textTransform: 'capitalize',
                backgroundColor: filter === s ? 'var(--primary-orange)' : 'transparent',
                color: filter === s ? '#000' : 'var(--text-muted)',
                border: '1px solid var(--border-color)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center' }}>
          Loading pets...
        </div>
      )}
      {error && (
        <div style={{
          padding: '1rem', background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8,
          color: '#ef4444', fontSize: '0.85rem',
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {!loading && !error && pets.length === 0 && (
        <div style={{ color: 'var(--text-muted)', padding: '3rem', textAlign: 'center' }}>
          No pets with status "{filter}"
        </div>
      )}
      {!loading && !error && pets.length > 0 && (
        <div className="petstore-grid">
          {pets.map((pet) => {
            const qty = cartQty(pet.id);
            return (
              <div
                key={pet.id}
                className="petstore-card"
                onClick={() => setSelectedPet(pet)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedPet(pet)}
              >
                <div className="petstore-card__img">
                  <span>{catEmoji(pet.category?.name)}</span>
                </div>
                <div className="petstore-card__body">
                  <div className="petstore-card__name">{pet.name}</div>
                  <div className="petstore-card__category">{pet.category?.name}</div>
                  <div style={{ color: 'var(--primary-orange)', fontWeight: 800, fontSize: '1rem', margin: '0.25rem 0' }}>
                    ${priceFor(pet).toLocaleString()}
                  </div>
                  <div className="petstore-card__footer">
                    <StatusBadge status={pet.status} />
                    {qty > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                        🛒 ×{qty}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedPet && (
        <PetModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
          onAddToCart={onAddToCart}
          cartQty={cartQty(selectedPet.id)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Login bar
// ---------------------------------------------------------------------------

function LoginBar({ onLogin }: { onLogin: () => void }) {
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/user/login?username=demo&password=demo');
      const text = await res.text();
      setSession(text);
      onLogin();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="petstore-login-bar">
      {session ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}>✅ Logged in</span>
          <code style={{ fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{session}</code>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>— API Shield: sequence step 1</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Not logged in — API Shield sees unauthenticated traffic
          </span>
          <button onClick={login} disabled={loading}
            style={{ width: 'auto', padding: '6px 16px', fontSize: '0.85rem' }}>
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page root
// ---------------------------------------------------------------------------

type View = 'store' | 'checkout';

export default function PetstorePage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [view, setView] = useState<View>('store');
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartRef = useRef(cartCount);
  cartRef.current = cartCount;

  const addToCart = (pet: Pet) => {
    setCart((prev) => {
      const existing = prev.find(i => i.pet.id === pet.id);
      if (existing) return prev.map(i => i.pet.id === pet.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { pet, quantity: 1 }];
    });
  };

  const removeFromCart = (petId: number) =>
    setCart((prev) => prev.filter(i => i.pet.id !== petId));

  const changeQty = (petId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(petId); return; }
    setCart((prev) => prev.map(i => i.pet.id === petId ? { ...i, quantity: qty } : i));
  };

  const handleCheckout = () => { setCartOpen(false); setView('checkout'); };
  const handleDone = () => { setCart([]); setView('store'); };

  if (view === 'checkout') {
    return (
      <div style={{ minHeight: '100vh' }}>
        <nav>
          <div className="logo">🐾 Petstore</div>
          <div className="nav-links">
            <Link to="/api-shield" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>← API Shield Demo</Link>
          </div>
          <div className="status-badge">
            <div className="dot"></div>
            Checkout
          </div>
        </nav>
        <CheckoutPage items={cart} onBack={() => setView('store')} onDone={handleDone} />
        <footer><p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p></footer>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <nav>
        <div className="logo">🐾 Petstore</div>
        <div className="nav-links">
          <Link to="/api-shield" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>← API Shield</Link>
          <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.95rem' }}>Dashboard</Link>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          style={{
            width: 'auto', padding: '6px 14px', fontSize: '0.85rem',
            background: cartCount > 0 ? 'var(--primary-orange)' : 'transparent',
            color: cartCount > 0 ? '#000' : 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          🛒 Cart {cartCount > 0 && <span style={{ fontWeight: 800 }}>{cartCount}</span>}
        </button>
      </nav>

      {/* API Shield banner */}
      <div style={{
        background: 'rgba(246,130,31,0.06)', borderBottom: '1px solid rgba(246,130,31,0.15)',
        padding: '0.5rem 5%', fontSize: '0.78rem', color: 'var(--text-muted)',
        display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
      }}>
        <span>🛡️ <strong style={{ color: 'var(--text-main)' }}>API Shield active</strong> — all requests logged and sequenced</span>
        <span>Backend: <code>petstore.work.appleflare.win</code> via Cloudflare Tunnel</span>
        <span>5-step purchase sequence tracked per session</span>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 5% 4rem' }}>
        <header style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', margin: '0 0 0.3rem' }}>
            Pet Store <span style={{ color: 'var(--primary-orange)' }}>Demo</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>
            A live storefront powered by the Petstore API · running on your gaming PC via Cloudflare Tunnel · protected by API Shield
          </p>
        </header>

        <LoginBar onLogin={() => {}} />
        <PetCatalogue cart={cart} onAddToCart={addToCart} />
      </div>

      {cartOpen && (
        <CartSidebar
          items={cart}
          onRemove={removeFromCart}
          onQtyChange={changeQty}
          onCheckout={handleCheckout}
          onClose={() => setCartOpen(false)}
        />
      )}

      <footer><p>&copy; 2026 appleflare.win — Built by a Solution Engineer.</p></footer>
    </div>
  );
}
