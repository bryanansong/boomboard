/**
 * Storage module using MMKV - fast, synchronous key-value storage.
 * @see https://github.com/mrousavy/react-native-mmkv
 */

import { createMMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

/** MMKV instance - use directly for synchronous operations. */
export const storage = createMMKV();

/**
 * Zustand persist storage adapter.
 * Wraps MMKV with JSON serialization for state persistence.
 */
export const zustandStorage: StateStorage = {
  getItem: (key) => {
    try {
      const value = storage.getString(key);
      return value ?? null;
    } catch (err) {
      console.error(`[Storage] get "${key}":`, err);
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      storage.set(key, value);
    } catch (err) {
      console.error(`[Storage] set "${key}":`, err);
    }
  },

  removeItem: (key) => {
    try {
      storage.remove(key);
    } catch (err) {
      console.error(`[Storage] remove "${key}":`, err);
    }
  },
};
