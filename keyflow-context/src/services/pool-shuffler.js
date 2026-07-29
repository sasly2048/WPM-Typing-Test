/**
 * Pool Exhaustion Shuffler Service
 * 
 * Guarantees true random selection without repetition until
 * the entire content pool for a given category/duration has been exhausted.
 */

const usedPools = new Map();

/**
 * Selects an item from an array ensuring no repetitions until all items have been seen.
 * @template T
 * @param {string} poolKey - Unique identifier for the content pool (e.g. 'quotes-medium', 'code-javascript')
 * @param {T[]} items - Array of available content objects or strings
 * @param {function(T): string} [idExtractor] - Optional function to extract unique ID from item
 * @returns {T} The selected item
 */
export function getNonRepeatingItem(poolKey, items, idExtractor) {
  if (!items || items.length === 0) return null;
  if (items.length === 1) return items[0];

  if (!usedPools.has(poolKey)) {
    usedPools.set(poolKey, new Set());
  }

  const usedSet = usedPools.get(poolKey);
  
  // Helper to get ID
  const getId = (item, index) => {
    if (idExtractor) return idExtractor(item);
    if (typeof item === 'object' && item.id) return item.id;
    if (typeof item === 'string') return item;
    return `item-${index}`;
  };

  // Find items not yet used
  const availableItems = items.filter((item, idx) => !usedSet.has(getId(item, idx)));

  // If pool exhausted, reset set
  if (availableItems.length === 0) {
    usedSet.clear();
    return getNonRepeatingItem(poolKey, items, idExtractor);
  }

  // Random pick from available
  const randomIndex = Math.floor(Math.random() * availableItems.length);
  const selectedItem = availableItems[randomIndex];
  
  // Find index in original array to extract ID
  const origIndex = items.indexOf(selectedItem);
  usedSet.add(getId(selectedItem, origIndex));

  return selectedItem;
}

/**
 * Resets the exhaustion tracking for a pool or all pools.
 * @param {string} [poolKey]
 */
export function resetPool(poolKey) {
  if (poolKey) {
    usedPools.delete(poolKey);
  } else {
    usedPools.clear();
  }
}
