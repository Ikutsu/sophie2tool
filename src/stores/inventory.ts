import { create } from "zustand";
import type { ElementColor, MultiLanguage, OwnedMaterial } from "../types/index.ts";

/** A co-op companion's friendship as read from the game (hearts 1-6). */
export interface Companion {
  key: string;
  element: ElementColor;
  hearts: number;
}

/** Local read-only bridge to the running game (bridge/server.py). */
export const BRIDGE_URL = "http://127.0.0.1:47823";
const CACHE_KEY = "sophie2.inventory.v2"; // v2: traits as ids + one name table

export type InventoryError = "bridgeOffline" | "gameNotRunning" | "unsupportedVersion" | "unknown";

interface Cached {
  items: OwnedMaterial[];
  traitNames: Record<number, MultiLanguage>;
  companions: Companion[];
  importedAt: number;
}

interface InventoryState {
  items: OwnedMaterial[] | null;
  traitNames: Record<number, MultiLanguage>;
  companions: Companion[] | null;
  importedAt: number | null;
  importing: boolean;
  error: InventoryError | null;
  useInventory: boolean;
  /** Resolves with the companions read in this import (null if the import failed). */
  importFromGame: () => Promise<Companion[] | null>;
  setUseInventory: (on: boolean) => void;
}

function readCache(): Cached | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

function writeCache(c: Cached): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* storage full or unavailable: the import still works for this session */
  }
}

interface BridgeReply {
  status: number;
  /** JSON from the bridge; the caller checks its shape. */
  body: { error?: string; items?: unknown; traits?: unknown; companions?: unknown };
}

/**
 * Read the material box from the local bridge. Direct fetch first; if the browser
 * blocks a public page from calling 127.0.0.1 (Chrome's local-network-access
 * permission), open the bridge's /handoff page in a small window: it reads the data
 * same-origin and posts it back. Must run within the click that started the import
 * (popups need a user gesture). Resolves null when the bridge can't be reached.
 */
async function readInventory(): Promise<BridgeReply | null> {
  try {
    const res = await fetch(`${BRIDGE_URL}/api/inventory`);
    return { status: res.status, body: await res.json() };
  } catch {
    return handoff();
  }
}

const HANDOFF_TIMEOUT_MS = 10_000;

function handoff(): Promise<BridgeReply | null> {
  const url = `${BRIDGE_URL}/handoff?origin=${encodeURIComponent(location.origin)}`;
  const win = window.open(url, "sophie2-bridge", "width=380,height=220");
  if (!win) return Promise.resolve(null); // popup blocked
  return new Promise((resolve) => {
    const done = (reply: BridgeReply | null) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      if (!reply && !win.closed) win.close(); // bridge not running: close the error page
      resolve(reply);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== BRIDGE_URL || e.data?.type !== "sophie2-bridge") return;
      done({ status: e.data.status, body: e.data.body });
    };
    window.addEventListener("message", onMessage);
    const timer = setTimeout(() => done(null), HANDOFF_TIMEOUT_MS);
  });
}

const cached = readCache();

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: cached?.items ?? null,
  traitNames: cached?.traitNames ?? {},
  companions: cached?.companions ?? null,
  importedAt: cached?.importedAt ?? null,
  importing: false,
  error: null,
  useInventory: cached != null,

  importFromGame: async () => {
    if (get().importing) return null;
    set({ importing: true, error: null });
    const reply = await readInventory();
    if (!reply) {
      set({ importing: false, error: "bridgeOffline" });
      return null;
    }
    const { status, body } = reply;
    if (status < 200 || status >= 300) {
      const err: InventoryError =
        body?.error === "gameNotRunning" || body?.error === "unsupportedVersion"
          ? body.error
          : "unknown";
      set({ importing: false, error: err });
      return null;
    }
    try {
      const items = body.items as OwnedMaterial[];
      const traitNames = body.traits as Record<number, MultiLanguage>;
      const companions = body.companions as Companion[];
      const importedAt = Date.now();
      writeCache({ items, traitNames, companions, importedAt });
      set({ items, traitNames, companions, importedAt, importing: false, useInventory: true });
      return companions;
    } catch {
      set({ importing: false, error: "unknown" });
      return null;
    }
  },

  setUseInventory: (on) => set({ useInventory: on && get().items != null }),
}));
