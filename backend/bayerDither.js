import findClosestPaletteColor from "./findClosestPaletteColor.js";

const palette = [
  [0xff, 0xff, 0xff, 0xff],
  [0x00, 0x00, 0x00, 0xff],
  [0xff, 0x00, 0x00, 0xff],
  //[0x00, 0xff, 0x00, 0xff],
  //[0x00, 0x00, 0xff, 0xff]
];

export default function bayerDither(imageData, quality = 4) {
  const width = imageData.width;
  const height = imageData.height;
  const map = getMap(quality);

  const ml = Math.sqrt(map.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const threshold = map[(y % ml) * ml + x % ml] * 256;
      var pixel = findClosestPaletteColor(
        palette,
        threshold + imageData.data[i + 0],
        threshold + imageData.data[i + 1],
        threshold + imageData.data[i + 2],
      )
      imageData.data.set(pixel, i);
    }
  }

  return imageData;
}

function getMap(n) {
  return [...generateMap(n)].map(i => (i + 1) / (n ** 2 + 1) - 0.5);

  function* generateMap(n) {
    if (n == 1) {
      yield 0;
      return;
    }

    const ul = generateMap(n / 2);
    const ur = generateMap(n / 2);
    const bl = generateMap(n / 2);
    const br = generateMap(n / 2);

    for (let y = 0; y < n / 2; y++) {
      for (let x = 0; x < n / 2; x++) {
        yield ul.next().value * 4;
      }
      for (let x = 0; x < n / 2; x++) {
        yield ur.next().value * 4 + 2;
      }
    }

    for (let y = 0; y < n / 2; y++) {
      for (let x = 0; x < n / 2; x++) {
        yield bl.next().value * 4 + 3;
      }
      for (let x = 0; x < n / 2; x++) {
        yield br.next().value * 4 + 1;
      }
    }
  }
}

