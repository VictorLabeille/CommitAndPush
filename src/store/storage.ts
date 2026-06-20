/**
 * Stockage persistant debouncé pour le middleware `persist` de Zustand — §6.4.
 *
 * Pour éviter une écriture AsyncStorage à chaque frappe, les écritures sont
 * regroupées avec un debounce (~300 ms). `flushStorage()` force l'écriture
 * immédiate de la dernière valeur en attente : on l'appelle sur les actions
 * critiques (validation de série, fin de séance) et au passage en arrière-plan,
 * pour garantir la reprise à l'identique après un kill de l'app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StateStorage } from 'zustand/middleware';

const DEBOUNCE_MS = 300;

let timer: ReturnType<typeof setTimeout> | null = null;
let pending: { key: string; value: string } | null = null;

function writePending(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (pending) {
    const { key, value } = pending;
    pending = null;
    void AsyncStorage.setItem(key, value);
  }
}

/** Écrit immédiatement la dernière valeur en attente (s'il y en a une). */
export function flushStorage(): void {
  writePending();
}

export const debouncedStorage: StateStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => {
    pending = { key, value };
    if (timer) clearTimeout(timer);
    timer = setTimeout(writePending, DEBOUNCE_MS);
  },
  removeItem: (key) => AsyncStorage.removeItem(key),
};
