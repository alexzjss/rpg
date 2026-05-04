/**
 * database.ts — Sistema de Persistência Unificado v3
 *
 * Princípios:
 *  - IndexedDB como único armazenamento primário (sem limite de 5MB)
 *  - Um "snapshot" completo cobre TODOS os dados do app
 *  - Listeners em memória notificam o React de mudanças
 *  - Export/Import trabalham com AppSnapshot tipado e versionado
 *  - Migração automática de versões antigas
 *  - Sem dependência de localStorage para dados críticos
 */

import { Card, Character, CombatState, JourneyState, Seal } from '../types';

// ─────────────────────────────────────────────────────────────────
// AppExtras — dados do GM / ferramentas que antes ficavam de fora
// ─────────────────────────────────────────────────────────────────
export interface AppExtras {
  gmNotes: string;
  combatNotes: string;
  shopCurrency: number;
  characterCurrencies: Record<string, number>;
  progressBars: Array<{ id: string; label: string; current: number; max: number; color: string }>;
  rollHistory: Array<{ id: string; result: number; type: string; timestamp: number }>;
  lootList: Array<{ id: string; name: string; rarity: string }>;
  nameStyle: string;
}

export const DEFAULT_EXTRAS: AppExtras = {
  gmNotes: '',
  combatNotes: '',
  shopCurrency: 0,
  characterCurrencies: {},
  progressBars: [{ id: '1', label: 'Progresso Customizado', current: 0, max: 100, color: '#d97706' }],
  rollHistory: [],
  lootList: [],
  nameStyle: 'fantasy',
};

// ─────────────────────────────────────────────────────────────────
// AppSnapshot — estado completo e versionado do app
// ─────────────────────────────────────────────────────────────────
export interface AppSnapshot {
  /** Versão do formato — bump quando o schema mudar */
  version: number;
  savedAt: string;
  characters: Character[];
  cards: Card[];
  seals: Seal[];
  combat: CombatState;
  journey: JourneyState;
  extras: AppExtras;
}

export const SNAPSHOT_VERSION = 3;

// ─────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────
export const DEFAULT_COMBAT: CombatState = {
  isActive: false,
  round: 1,
  turnIndex: 0,
  combatants: [],
  history: [],
  fieldConditions: [],
  backgroundImage: '',
  globalBonus: 0,
  gridWidth: 10,
  gridHeight: 10,
  visualWidthPct: 100,
  visualHeightPx: 600,
  maintainAspectRatio: true,
};

export const DEFAULT_JOURNEY: JourneyState = {
  locationName: 'Local Desconhecido',
  description: '',
  image: '',
  weather: 'sunny',
  notes: '',
  recipes: [],
};

// ─────────────────────────────────────────────────────────────────
// IndexedDB internals
// ─────────────────────────────────────────────────────────────────
const IDB_NAME = 'rpg_master_db';
// bump para 4 → garante onupgradeneeded nos browsers que ainda têm v1/v2/v3
const IDB_VERSION = 4;

const ALL_STORES = ['characters', 'cards', 'seals', 'meta'] as const;
type Store = typeof ALL_STORES[number];

let _idbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of ALL_STORES) {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      _idbPromise = null; // allow retry
      reject(req.error);
    };
  });
  return _idbPromise;
}

async function _getAll<T>(store: Store): Promise<T[]> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => res((req.result ?? []) as T[]);
    req.onerror = () => rej(req.error);
  });
}

async function _get<T>(store: Store, key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readonly').objectStore(store).get(key);
    req.onsuccess = () => res(req.result as T | undefined);
    req.onerror = () => rej(req.error);
  });
}

async function _put(store: Store, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const req = tx.objectStore(store).put(value);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

async function _delete(store: Store, key: string): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

/** Substitui todos os itens de um store numa única transação */
async function _replaceAll(store: Store, items: any[]): Promise<void> {
  const db = await openDB();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, 'readwrite');
    const s = tx.objectStore(store);
    const clearReq = s.clear();
    clearReq.onsuccess = () => {
      let pending = items.length;
      if (pending === 0) { res(); return; }
      for (const item of items) {
        const r = s.put(item);
        r.onsuccess = () => { if (--pending === 0) res(); };
        r.onerror = () => rej(r.error);
      }
    };
    clearReq.onerror = () => rej(clearReq.error);
    tx.onerror = () => rej(tx.error);
  });
}

// ─────────────────────────────────────────────────────────────────
// Sanitizers / coercions
// ─────────────────────────────────────────────────────────────────
function ensureChar(c: any): Character {
  return { ...c, items: c.items ?? [], conditions: c.conditions ?? [], cardIds: c.cardIds ?? [] };
}

function ensureSeal(s: any): Seal {
  return { ...s };
}

function ensureCombat(raw: any): CombatState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_COMBAT };
  return {
    ...DEFAULT_COMBAT,
    ...raw,
    combatants: Array.isArray(raw.combatants) ? raw.combatants : [],
    history: Array.isArray(raw.history) ? raw.history : [],
    fieldConditions: Array.isArray(raw.fieldConditions) ? raw.fieldConditions : [],
  };
}

function ensureJourney(raw: any): JourneyState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_JOURNEY };
  return { ...DEFAULT_JOURNEY, ...raw, recipes: Array.isArray(raw.recipes) ? raw.recipes : [] };
}

function ensureExtras(raw: any): AppExtras {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_EXTRAS };
  return {
    ...DEFAULT_EXTRAS,
    ...raw,
    characterCurrencies: raw.characterCurrencies ?? {},
    progressBars: Array.isArray(raw.progressBars) ? raw.progressBars : DEFAULT_EXTRAS.progressBars,
    rollHistory: Array.isArray(raw.rollHistory) ? raw.rollHistory : [],
    lootList: Array.isArray(raw.lootList) ? raw.lootList : [],
  };
}

// ─────────────────────────────────────────────────────────────────
// In-memory listener registry
// ─────────────────────────────────────────────────────────────────
type ListenerKey = 'characters' | 'cards' | 'seals' | 'combat' | 'journey' | 'extras';
const _listeners: Record<ListenerKey, Function[]> = {
  characters: [], cards: [], seals: [], combat: [], journey: [], extras: [],
};

function _notify(key: ListenerKey, data: any) {
  for (const cb of [..._listeners[key]]) {
    try { cb(data); } catch (e) { console.error(`[DB] listener error (${key}):`, e); }
  }
}

function _subscribe<T>(key: ListenerKey, cb: (d: T) => void): () => void {
  _listeners[key].push(cb);
  return () => { _listeners[key] = _listeners[key].filter(l => l !== cb); };
}

// ─────────────────────────────────────────────────────────────────
// Migration from older formats
// ─────────────────────────────────────────────────────────────────
async function runMigrations() {
  const done = await _get<any>('meta', '__migration_v4');
  if (done?.ok) return;

  console.log('[DB] Verificando migrações...');
  try {
    // Tenta restaurar do autosave antigo do localStorage
    const raw = localStorage.getItem('rpg_master_autosave');
    if (raw) {
      let snap: any;
      try { snap = JSON.parse(raw); } catch { snap = null; }
      if (snap) {
        const existingChars = await _getAll<any>('characters');
        // Só migra se o IDB estiver vazio (evita sobrescrever dados)
        if (existingChars.length === 0) {
          console.log('[DB] Migrando autosave do localStorage...');
          if (Array.isArray(snap.characters)) for (const c of snap.characters) await _put('characters', ensureChar(c));
          if (Array.isArray(snap.cards)) for (const c of snap.cards) await _put('cards', c);
          if (Array.isArray(snap.seals)) for (const s of snap.seals) await _put('seals', ensureSeal(s));
          if (snap.combat) await _put('meta', { id: '__combat', value: snap.combat });
          if (snap.journey) await _put('meta', { id: '__journey', value: snap.journey });
          console.log('[DB] Migração do localStorage concluída.');
        }
      }
    }
    await _put('meta', { id: '__migration_v4', ok: true });
  } catch (e) {
    console.error('[DB] Erro na migração:', e);
  }
}

// ─────────────────────────────────────────────────────────────────
// Load all from IDB
// ─────────────────────────────────────────────────────────────────
async function loadAll() {
  const [chars, cards, seals, combatRec, journeyRec, extrasRec] = await Promise.all([
    _getAll<any>('characters'),
    _getAll<any>('cards'),
    _getAll<any>('seals'),
    _get<any>('meta', '__combat'),
    _get<any>('meta', '__journey'),
    _get<any>('meta', '__extras'),
  ]);
  return {
    characters: chars.map(ensureChar),
    cards: cards as Card[],
    seals: seals.map(ensureSeal) as Seal[],
    combat: ensureCombat(combatRec?.value),
    journey: ensureJourney(journeyRec?.value),
    extras: ensureExtras(extrasRec?.value),
  };
}

// ─────────────────────────────────────────────────────────────────
// DatabaseService — interface pública
// ─────────────────────────────────────────────────────────────────
export const DatabaseService = {

  // ── Boot: carrega tudo de uma vez ───────────────────────────────
  initialize: async (): Promise<{
    characters: Character[];
    cards: Card[];
    seals: Seal[];
    combat: CombatState;
    journey: JourneyState;
    extras: AppExtras;
  }> => {
    await runMigrations();
    return loadAll();
  },

  // ── Subscriptions (chamadas no mount do componente) ─────────────
  syncCharacters: (cb: (d: Character[]) => void) => {
    _getAll<Character>('characters').then(d => cb(d.map(ensureChar))).catch(() => cb([]));
    return _subscribe<Character[]>('characters', cb);
  },
  syncCards: (cb: (d: Card[]) => void) => {
    _getAll<Card>('cards').then(d => cb(d)).catch(() => cb([]));
    return _subscribe<Card[]>('cards', cb);
  },
  syncSeals: (cb: (d: Seal[]) => void) => {
    _getAll<Seal>('seals').then(d => cb(d.map(ensureSeal))).catch(() => cb([]));
    return _subscribe<Seal[]>('seals', cb);
  },
  syncCombatState: (cb: (d: CombatState) => void) => {
    _get<any>('meta', '__combat').then(r => cb(ensureCombat(r?.value))).catch(() => cb({ ...DEFAULT_COMBAT }));
    return _subscribe<CombatState>('combat', cb);
  },
  syncJourneyState: (cb: (d: JourneyState) => void) => {
    _get<any>('meta', '__journey').then(r => cb(ensureJourney(r?.value))).catch(() => cb({ ...DEFAULT_JOURNEY }));
    return _subscribe<JourneyState>('journey', cb);
  },
  syncExtras: (cb: (d: AppExtras) => void) => {
    _get<any>('meta', '__extras').then(r => cb(ensureExtras(r?.value))).catch(() => cb({ ...DEFAULT_EXTRAS }));
    return _subscribe<AppExtras>('extras', cb);
  },

  // ── Saves individuais ────────────────────────────────────────────
  saveCharacter: async (char: Character) => {
    const c = ensureChar(char);
    await _put('characters', c);
    _notify('characters', (await _getAll<Character>('characters')).map(ensureChar));
  },
  deleteCharacter: async (id: string) => {
    await _delete('characters', id);
    _notify('characters', (await _getAll<Character>('characters')).map(ensureChar));
  },

  saveCard: async (card: Card) => {
    await _put('cards', card);
    _notify('cards', await _getAll<Card>('cards'));
  },
  deleteCard: async (id: string) => {
    await _delete('cards', id);
    _notify('cards', await _getAll<Card>('cards'));
  },

  saveSeal: async (seal: Seal) => {
    await _put('seals', seal);
    _notify('seals', (await _getAll<Seal>('seals')).map(ensureSeal));
  },
  deleteSeal: async (id: string) => {
    await _delete('seals', id);
    _notify('seals', (await _getAll<Seal>('seals')).map(ensureSeal));
  },

  updateCombat: async (state: CombatState) => {
    await _put('meta', { id: '__combat', value: state });
    _notify('combat', state);
  },
  updateJourney: async (state: JourneyState) => {
    await _put('meta', { id: '__journey', value: state });
    _notify('journey', state);
  },
  updateExtras: async (extras: AppExtras) => {
    await _put('meta', { id: '__extras', value: extras });
    _notify('extras', extras);
  },

  // ── Snapshot: salva TUDO de uma vez ─────────────────────────────
  saveFullSnapshot: async (snapshot: AppSnapshot): Promise<void> => {
    await Promise.all([
      _replaceAll('characters', snapshot.characters.map(ensureChar)),
      _replaceAll('cards', snapshot.cards),
      _replaceAll('seals', snapshot.seals.map(ensureSeal)),
      _put('meta', { id: '__combat', value: snapshot.combat }),
      _put('meta', { id: '__journey', value: snapshot.journey }),
      _put('meta', { id: '__extras', value: snapshot.extras }),
      _put('meta', { id: '__snapshot_meta', savedAt: snapshot.savedAt, version: snapshot.version }),
    ]);
    // Notifica todos os listeners
    _notify('characters', snapshot.characters.map(ensureChar));
    _notify('cards', snapshot.cards);
    _notify('seals', snapshot.seals.map(ensureSeal));
    _notify('combat', snapshot.combat);
    _notify('journey', snapshot.journey);
    _notify('extras', snapshot.extras);
  },

  // ── Constrói snapshot a partir dos dados atuais no IDB ──────────
  buildSnapshot: async (): Promise<AppSnapshot> => {
    const data = await loadAll();
    return {
      version: SNAPSHOT_VERSION,
      savedAt: new Date().toISOString(),
      ...data,
    };
  },

  // ── Restaura snapshot (import de arquivo) ────────────────────────
  restoreSnapshot: async (raw: any): Promise<{ ok: boolean; error?: string }> => {
    try {
      if (!raw || typeof raw !== 'object') return { ok: false, error: 'Arquivo inválido (não é um objeto JSON)' };

      const snapshot: AppSnapshot = {
        version: raw.version ?? 1,
        savedAt: raw.savedAt ?? new Date().toISOString(),
        characters: Array.isArray(raw.characters) ? raw.characters.map(ensureChar) : [],
        cards: Array.isArray(raw.cards) ? raw.cards : [],
        seals: Array.isArray(raw.seals) ? raw.seals : [],
        combat: ensureCombat(raw.combat),
        journey: ensureJourney(raw.journey),
        // Suporte a formato antigo (sem extras encapsulado)
        extras: ensureExtras(
          raw.extras ?? {
            gmNotes: raw.gmNotes,
            combatNotes: raw.combatNotes,
            shopCurrency: raw.shopCurrency,
            characterCurrencies: raw.characterCurrencies,
            progressBars: raw.progressBars,
            rollHistory: raw.rollHistory,
            lootList: raw.lootList,
            nameStyle: raw.nameStyle,
          }
        ),
      };

      await DatabaseService.saveFullSnapshot(snapshot);
      return { ok: true };
    } catch (e: any) {
      console.error('[DB] Erro ao restaurar snapshot:', e);
      return { ok: false, error: e?.message ?? 'Erro desconhecido' };
    }
  },
};
