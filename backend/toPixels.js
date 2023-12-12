const WHITE = 0xffffff;
const RED = 0xff0000;
/**
 *
 * @param {Uint8Array} data
 * @param {(x: number, y: number) => number} map
 * @returns {Uint8Array}
 */
export default function toPixels(data, map = (x, y) => 480 * 800 - y * 800 - x) {
  const buffer = new Uint8Array(((800 * 480) / 8) * 2);
  var pixels = new Uint32Array(data.buffer);
  for (let y = 0; y < 480; y++) {
    for (let x = 0; x < 800; x++) {
      const i = map(x, y);
      const j = y * 800 + x;
      const bgr = pixels[i] & WHITE;
      if (bgr === RED) {
        buffer[48000 + Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      } else if (bgr === WHITE) {
        buffer[Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      }
    }
  }
  return buffer;
}
