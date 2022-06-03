export const floydSteinberg = [
  [0 / 16, "x", 7 / 16],
  [3 / 16, 5 / 16, 1 / 16],
];

export const sierra = [
  [0 / 32, 0 / 32, "x", 5 / 32, 3 / 32],
  [2 / 32, 4 / 32, 5 / 32, 4 / 32, 2 / 32],
  [0 / 32, 2 / 32, 3 / 32, 2 / 32, 0 / 32],
];

/**
 *
 * @param {ImageData} imageData
 * @param {*} algorithm
 */
export default function dither(imageData, algorithm) {
  const width = imageData.width;
  const height = imageData.height;
  const data = new Uint8ClampedArray(imageData.data.buffer);
  const center = algorithm[0].indexOf("x");
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const oldPixel = [...data.subarray(i, i + 4)];

      const newPixel = findClosestPaletteColor(...oldPixel);
      data.set(newPixel, i);
      const error = oldPixel.map((v, i) => v - newPixel[i]);

      for (let r = 0; r < algorithm.length && y + r < height; r++) {
        for (let c = 0; c < algorithm[r].length; c++) {
          if (c - center + x < 0) continue;
          if (c - center + x >= width) continue;

          const weight = algorithm[r][c];

          if (weight != "x") {
            add(data.subarray(i + (r * width + c - center) * 4), error, weight);
          }
        }
      }
    }
  }
}

function add(a, b, c) {
  for (let i = 0; i < b.length; i++) {
    a[i] += b[i] * c;
  }
}

function findClosestPaletteColor(...pixel) {
  const palette = [
    [0xff, 0xff, 0xff, 0xff],
    [0x00, 0x00, 0x00, 0xff],
    [0xff, 0x00, 0x00, 0xff],
  ];

  return palette
    .map((p) => ({
      p,
      rms: Math.sqrt(
        p
          .map((v, i) => v - pixel[i])
          .map((v) => v * v)
          .reduce((a, b) => a + b) / 3
      ),
    }))
    .sort((a, b) => a.rms - b.rms)[0].p;
}
