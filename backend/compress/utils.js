//@ts-check

/**
 * @param {number[] | Uint8Array} arr
 * @param {number} i
 */
export function getQuad(arr, i) {
  return arr[i + 3] |
    (arr[i + 2] << 8) |
    (arr[i + 1] << 16) |
    (arr[i + 0] << 24);
}

/**
 * @param {Map<number, number>} histogram
 * @param {number} quad
 */
export function bump(histogram, quad) {
  return histogram.set(quad, (histogram.get(quad) ?? 0) + 1);
}

/**
 * @param {Map<number, number>} histogram
 * @returns {[number, number][]}
 */
export function getMostFrequent(histogram, count = 64, min = 0) {
  return [...histogram.entries()]
    .filter((a) => a[1] > min)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}

/**
 * @param {number} q
 */
export function toFourBytes(q) {
  return [
    (q >> 24) & 0xff,
    (q >> 16) & 0xff,
    (q >> 8) & 0xff,
    (q >> 0) & 0xff,
  ];
}

/**
 * @param {number} q
 */
export function formatQuad(q) {
  return (q >>> 0).toString(16).padStart(8, "0");
}
