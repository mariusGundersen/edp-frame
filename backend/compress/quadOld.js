//@ts-check

import { bump, getMostFrequent, getQuad, toFourBytes } from "./utils.js";

/**
 * @param {Uint8Array} input
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

  return output;
}

/**
 * @param {number[]} input
 * @param {number} size
 */
export function decompress(input, size) {
  const output = new Uint8Array(size);
  let o = 0;
  let i = 256;
  const repeats = {};
  const actuals = {};
  while (o < size) {
    if (input[i] < 0) {
      repeats[1 - input[i]] ??= 0;
      repeats[1 - input[i]]++;
      for (let repeat = 1 - input[i++]; repeat > 0; repeat--) {
        output[o++] = input[i];
      }
      i++;
    } else if (input[i] >= 64) {
      const index = input[i] - 64;
      output[o++] = input[index * 4 + 0];
      output[o++] = input[index * 4 + 1];
      output[o++] = input[index * 4 + 2];
      output[o++] = input[index * 4 + 3];
      i++;
    } else {
      actuals[1 + input[i]] ??= 0;
      actuals[1 + input[i]]++;
      for (let actual = 1 + input[i++]; actual > 0; actual--) {
        output[o++] = input[i++];
      }
    }
  }

  return output;
}