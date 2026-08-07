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

  let availableItems = items.filter((item, idx) => !usedSet.has(getId(item, idx)));

  // Pool exhausted: start a fresh cycle.
  //
  // The previous version recursed here. That did terminate — clearing the set
  // guarantees the next filter matches everything — but it relied on that
  // invariant holding rather than stating it, and any future change to the
  // clearing logic would have turned it into unbounded recursion. Resetting
  // in place is the same behaviour with the exit made structural.
  if (availableItems.length === 0) {
    usedSet.clear();
    availableItems = items.filter((item, idx) => !usedSet.has(getId(item, idx)));
    if (availableItems.length === 0) {
      // Every id collides. Return something usable rather than looping.
      return items[Math.floor(Math.random() * items.length)];
    }
  }

  const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];

  // indexOf on the original array keeps the id stable with what the filter saw.
  usedSet.add(getId(selectedItem, items.indexOf(selectedItem)));

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
