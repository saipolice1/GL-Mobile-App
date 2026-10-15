export const MAX_RECENT_SEARCHES = 8;

/**
 * Returns a new recent-searches list with `query` moved to the front.
 * Queries shorter than 2 characters (after trimming) leave the list unchanged.
 * Duplicates are removed case-insensitively and the list is capped at
 * MAX_RECENT_SEARCHES entries.
 */
export function updateRecentList(list, query) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return list || [];
  const withoutDuplicate = (list || []).filter(
    (item) => item.toLowerCase() !== trimmed.toLowerCase()
  );
  return [trimmed, ...withoutDuplicate].slice(0, MAX_RECENT_SEARCHES);
}
