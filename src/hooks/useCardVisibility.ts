// src/hooks/useCardVisibility.ts
//
// Custom React hook that manages which dashboard cards are visible.
//
// Persistence layers (in priority order):
//   1. URL query string  (?cards=ai,edge  or  ?hide=r2,d1)
//   2. localStorage      (key: APPLEFLARE_CARDS_KEY)
//   3. Defaults          (all cards visible)
//
// URL params win because they're shareable / linkable for demos.
// localStorage is the persistent fallback so a user's choices survive reloads.

import { useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Card registry — single source of truth for which cards exist.
// To add a new card: 1) create the component, 2) add an entry here, 3) wire it
// into App.tsx's <main> grid. Done.
// ---------------------------------------------------------------------------
export const CARD_DEFINITIONS = [
  { id: 'edge', label: 'Edge Compute Status' },
  { id: 'r2', label: 'R2 Object Vault' },
  { id: 'd1', label: 'D1 Relational Data' },
  { id: 'turnstile', label: 'Turnstile Security' },
  { id: 'ai', label: 'AI Insight' },
  { id: 'apishield', label: 'API Shield' },
] as const;

export type CardId = (typeof CARD_DEFINITIONS)[number]['id'];

export type VisibilityMap = Record<CardId, boolean>;

const STORAGE_KEY = 'appleflare:cards:visibility';

// All visible by default.
function defaultVisibility(): VisibilityMap {
  return CARD_DEFINITIONS.reduce((acc, card) => {
    acc[card.id] = true;
    return acc;
  }, {} as VisibilityMap);
}

// Parse the URL query string for ?cards= or ?hide= directives.
// Returns null if no relevant params are present.
function visibilityFromUrl(): VisibilityMap | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const cards = params.get('cards');
  const hide = params.get('hide');
  if (!cards && !hide) return null;

  const map = defaultVisibility();
  const validIds = new Set(CARD_DEFINITIONS.map((c) => c.id));

  if (cards) {
    // Only the listed ones are visible.
    (Object.keys(map) as CardId[]).forEach((id) => (map[id] = false));
    cards
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is CardId => validIds.has(s as CardId))
      .forEach((id) => (map[id] = true));
  }

  if (hide) {
    hide
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is CardId => validIds.has(s as CardId))
      .forEach((id) => (map[id] = false));
  }

  return map;
}

// Read from localStorage, with safe fallback.
function visibilityFromStorage(): VisibilityMap | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisibilityMap>;
    const map = defaultVisibility();
    (Object.keys(map) as CardId[]).forEach((id) => {
      if (typeof parsed[id] === 'boolean') map[id] = parsed[id] as boolean;
    });
    return map;
  } catch {
    return null;
  }
}

export function useCardVisibility() {
  // Initial state precedence: URL > localStorage > defaults.
  const [visible, setVisible] = useState<VisibilityMap>(
    () => visibilityFromUrl() ?? visibilityFromStorage() ?? defaultVisibility()
  );

  // Persist whenever it changes (skip if URL controlled, to keep URL the
  // source of truth for shared links).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlControlled = visibilityFromUrl() !== null;
    if (urlControlled) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visible));
    } catch {
      // Storage may be unavailable (private mode); silently ignore.
    }
  }, [visible]);

  const toggle = (id: CardId) =>
    setVisible((prev) => ({ ...prev, [id]: !prev[id] }));

  const showAll = () =>
    setVisible(
      CARD_DEFINITIONS.reduce(
        (acc, c) => ({ ...acc, [c.id]: true }),
        {} as VisibilityMap
      )
    );

  const hideAll = () =>
    setVisible(
      CARD_DEFINITIONS.reduce(
        (acc, c) => ({ ...acc, [c.id]: false }),
        {} as VisibilityMap
      )
    );

  return { visible, toggle, showAll, hideAll };
}
