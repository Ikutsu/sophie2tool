import { create } from "zustand";
import type { ElementColor, MultiLanguage, OwnedMaterial } from "../types/index.ts";

/** A co-op companion's friendship as read from the game (hearts 1-6). */
export interface Companion {
  key: string;
  element: ElementColor;
  hearts: number;
}

/** Local read-only bridge to the running game (game-bridge/server.py). */
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
    let res: Response;
    try {
      res = await fetch(`${BRIDGE_URL}/api/inventory`);
    } catch {
      set({ importing: false, error: "bridgeOffline" });
      return null;
    }
    try {
      const body = await res.json();
      if (!res.ok) {
        const err: InventoryError =
          body.error === "gameNotRunning" || body.error === "unsupportedVersion"
            ? body.error
            : "unknown";
        set({ importing: false, error: err });
        return null;
      }
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
