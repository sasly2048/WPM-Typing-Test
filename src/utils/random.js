/**
 * Picks a random element from an array.
 * @param {Array} array
 * @returns {*}
 */
export const pickRandom = (array) => array[Math.floor(Math.random() * array.length)];

/**
 * Shuffles an array using Fisher-Yates algorithm. Returns a new array.
 * @param {Array} array
 * @returns {Array}
 */
export const shuffle = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

/**
 * A seeded random number generator (xoshiro128ss or simple LCG).
 * @param {number} seed
 * @returns {Function} A function that returns a float between 0 and 1.
 */
export const seededRandom = (seed) => {
  let t = seed += 0x6D2B79F5;
  return () => {
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
};

/**
 * Gets a random seed based on the current date (YYYYMMDD).
 * @returns {number}
 */
export const getDailySeed = () => {
  const d = new Date();
  return parseInt(`${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`, 10);
};
