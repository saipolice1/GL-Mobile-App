import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateRecentList, MAX_RECENT_SEARCHES } from './recentSearchList';

const STORAGE_KEY = '@recent_searches';

export { updateRecentList, MAX_RECENT_SEARCHES };

/**
 * Reads the saved recent searches. Returns an empty list when nothing is
 * stored or storage cannot be read.
 */
export async function getRecentSearches() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Moves `query` to the front of the recent searches and persists the list
 * when it changed. Returns the updated list.
 */
export async function addRecentSearch(query) {
  const current = await getRecentSearches();
  const updated = updateRecentList(current, query);
  if (updated !== current) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage failures; the in-memory list is still returned.
    }
  }
  return updated;
}

/**
 * Removes all saved recent searches and returns the new (empty) list.
 */
export async function clearRecentSearches() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return [];
}
