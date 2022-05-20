export default function findClosestPaletteColor(palette, ...pixel) {
  let best = 0;
  let lowest = diff(palette[0], pixel);

  for (let i = 1; i < palette.length; i++) {
    let rms = diff(palette[i], pixel);

    if (rms < lowest) {
      lowest = rms;
      best = i;
    }
  }

  return palette[best];

  function diff(a, b) {
    return Math.abs(a[0] - b[0])
      + Math.abs(a[1] - b[1])
      + Math.abs(a[2] - b[2]);
  }
}
