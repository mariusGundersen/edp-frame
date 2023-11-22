//@ts-check

import { bump, getMostFrequent, getQuad, toFourBytes } from "./utils.js";

/**
 * @param {Uint8Array} input
 * @returns {Uint8Array}
 */
export function compress(input) {
  const histogram = new Map();
  for (let i = 0; i < input.length - 3; i++) {
    if (
      //aa[bc__]
      input[i - 2] === input[i - 1] &&
      input[i - 1] !== input[i] &&
      input[i] !== input[i + 1]
    ) {
      const quad = getQuad(input, i);
      bump(histogram, quad);
    }
  }

  const entries = getMostFrequent(histogram);

  const expectedUsages = entries.map((a) => a[1]);
  const usages = new Array(64).fill(0);

  const quads = entries.map((a) => a[0]);

  const output = quads.flatMap(toFourBytes);

  for (let i = output.length; i < 256; i++) {
    output[i] = 0;
  }
  let o = output.length;
  let i = 0;

  while (i < input.length) {
    const quadIndex = quads.indexOf(getQuad(input, i));

    if (quadIndex >= 0) {
      output[o++] = 64 + quadIndex;
      usages[quadIndex]++;
      i += 4;
      continue;
    }

    let repeats = 1;
    while (
      i + repeats < input.length &&
      input[i] === input[i + repeats] &&
      repeats < 128
    ) {
      if (quads.includes(getQuad(input, i + repeats))) break;
      repeats++;
    }
    if (repeats > 1) {
      output[o++] = 1 - repeats;
      output[o++] = input[i];
      i += repeats;
    } else {
      const from = i + 1;
      const headerPos = o++;
      while (i < input.length && i - from < 63) {
        if (input[i] === input[i + 1] && input[i] === input[i + 2]) break;
        if (quads.includes(getQuad(input, i))) break;
        output[o++] = input[i++];
      }
      output[headerPos] = i - from;
    }
  }

  return new Uint8Array(output);
}

/**
 * @param {Uint8Array} input
 * @param {number} size
 */
export function decompress(input, size) {
  const output = new Uint8Array(size);
  let o = 0;
  let i = 256;
  while (o < size) {
    if (input[i] < 0) {
      const repeats = 1 - input[i++];
      output.fill(input[i], o, o + repeats);
      o += repeats;
      i++;
    } else if (input[i] >= 64) {
      const index = input[i] - 64;
      output.set(input.slice(index * 4, index * 4 + 4), o);
      o += 4;
      i++;
    } else {
      const actuals = 1 + input[i++];
      output.set(input.slice(i, i + actuals), o);
      i += actuals;
      o += actuals;
    }
  }

  return output;
}

export function streamDecompress(size, callback) {
  const CHUNK_LENGTH = 480;
  const lookup = new Uint8Array(256);
  const chunk = new Uint8Array(CHUNK_LENGTH);

  let l = 0;
  let c = 0;
  let o = 0;
  let repeat = 0;
  let actual = 0;
  let quad = 0;

  return input => {
    for (let i = 0; i < input.length;) {
      if (l < 256) {
        lookup[l++] = input[i++];
      } else if (o + c >= size) {
        return;
      } else if (repeat > 0) {
        chunk[c++] = input[i];
        repeat--;
        if (repeat === 0) i++;
      } else if (actual > 0) {
        chunk[c++] = input[i++];
        actual--;
      } else if (quad > 0) {
        chunk[c++] = lookup[(input[i] - 64) * 4 + 4 - quad];
        quad--;
        if (quad === 0) i++;
      } else if (input[i] < 0) {
        repeat = 1 - input[i++];
      } else if (input[i] >= 64) {
        quad = 4;
      } else {
        actual = 1 + input[i++];
      }

      if (c === CHUNK_LENGTH) {
        callback(chunk);
        c = 0;
        o += CHUNK_LENGTH;
      }
    }
  }
}