import type { FederationStats } from './types';

// --- CONFIG ---
const N1_URL  = 'https://waterpolo.ffnatation.fr/fr/team/15616511';
const U18_URL = 'https://waterpolo.ffnatation.fr/fr/team/15617669';
// allorigins proxies the request server-side → bypasses CORS
const PROXY   = 'https://api.allorigins.win/get?url=';
const CACHE_KEY = 'ffn_fed_stats_v2';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

// --- TYPES ---
interface RawPlayerStats {
  fullName: string;        // "Arthur PEREA"
  matchesPlayed: number;
  shotsOnGoal: number;
  goals: number;
  exclusions: number;
  penalties: number;
}

export interface FedStatsResult {
  n1: RawPlayerStats[];
  u18: RawPlayerStats[];
  timestamp: number;        // ms since epoch
  lastUpdatedLabel: string; // "le 15/05/2026 à 08:31"
  fromCache: boolean;
}

// --- HTML PARSER ---
// Columns: Nom|MJ|TG|B|BP|B5P|CJ|CR|EX|ED|EB|EP|P|A|TM|Associé
//           0   1  2  3  4   5  6  7  8  9  10 11 12 ...
const parseFfnHtml = (html: string): RawPlayerStats[] => {
  const players: RawPlayerStats[] = [];

  // Grab every <tr> block
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRe.exec(html)) !== null) {
    const rowHtml = rowMatch[1];

    // Split on </td> boundaries
    const cellsRaw = rowHtml.split(/<\/td>/i);
    if (cellsRaw.length < 13) continue;

    // Strip all tags, collapse whitespace
    const text = (s: string) =>
      s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const cells = cellsRaw.map(text);

    // Name cell: "Voir Arthur PEREA" → strip "Voir"
    const rawName = cells[0].replace(/^voir\s*/i, '').trim();
    // Must start with uppercase letter (skip header rows)
    if (!rawName || !/^[A-ZÀ-Ö]/.test(rawName)) continue;

    const mj  = parseInt(cells[1]) || 0;
    const tg  = parseInt(cells[2]) || 0;
    const b   = parseInt(cells[3]) || 0;
    const ex  = parseInt(cells[8]) || 0;
    const p   = parseInt(cells[12]) || 0;

    players.push({
      fullName:      rawName,
      matchesPlayed: mj,
      shotsOnGoal:   tg,
      goals:         b,
      exclusions:    ex,
      penalties:     p,
    });
  }

  return players;
};

// --- FETCH ONE PAGE ---
const fetchPage = async (url: string): Promise<string> => {
  const res  = await fetch(`${PROXY}${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return (json.contents as string) || '';
};

// --- NAME MATCHING ---
// Normalize accents, dashes, case for fuzzy match
const norm = (s: string) =>
  s.normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '')
   .toUpperCase()
   .replace(/[-']/g, ' ')
   .replace(/\s+/g, ' ')
   .trim();

export const matchToAthlete = (
  players: RawPlayerStats[],
  competition: 'N1' | 'U18',
  athleteFirstName: string,
  athleteLastName: string
): FederationStats | null => {
  const fullTarget = norm(`${athleteFirstName} ${athleteLastName}`);
  const parts      = fullTarget.split(' ');

  const match = players.find(p => {
    const n = norm(p.fullName);
    return n === fullTarget || parts.every(part => n.includes(part));
  });

  if (!match) return null;

  return {
    competition,
    matchesPlayed: match.matchesPlayed,
    goals:         match.goals,
    shotsOnGoal:   match.shotsOnGoal,
    exclusions:    match.exclusions,
    penalties:     match.penalties,
  };
};

// --- MAIN EXPORT ---
export const getFederationStats = async (forceRefresh = false): Promise<FedStatsResult | null> => {
  // 1. Check localStorage cache
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as FedStatsResult;
        if (Date.now() - cached.timestamp < CACHE_TTL) {
          return { ...cached, fromCache: true };
        }
      }
    } catch {/* ignore */}
  }

  // 2. Fetch fresh data
  try {
    const [n1Html, u18Html] = await Promise.all([
      fetchPage(N1_URL),
      fetchPage(U18_URL),
    ]);

    const n1  = parseFfnHtml(n1Html);
    const u18 = parseFfnHtml(u18Html);

    // If both are empty the pages probably didn't render (CSR fallback)
    if (n1.length === 0 && u18.length === 0) {
      console.warn('[FFN] Pages returned empty tables — likely CSR only. Using fallback.');
      return null;
    }

    const timestamp = Date.now();
    const d = new Date(timestamp);
    const label = `le ${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const result: FedStatsResult = {
      n1,
      u18,
      timestamp,
      lastUpdatedLabel: label,
      fromCache: false,
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {/* storage full? */}

    return result;
  } catch (err) {
    console.error('[FFN] Scraping failed:', err);
    // Try to return stale cache rather than nothing
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const stale = JSON.parse(raw) as FedStatsResult;
        return { ...stale, fromCache: true };
      }
    } catch {/* ignore */}
    return null;
  }
};
