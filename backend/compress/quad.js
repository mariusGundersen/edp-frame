//@ts-check

import { bump, getMostFrequent, getQuad, toFourBytes } from "./utils.js";

/**
 * @param {Uint8Array} input
 */
export function compress(input) {
  const output = [];
  let o = 0;
  let i = 0;

  while (i < input.length) {
    let repeats = 1;
    while (
      i + repeats < input.length &&
      input[i] === input[i + repeats] &&
      repeats < 128
    ) {
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
        output[o++] = input[i++];
      }

      output[headerPos] = i - from;
    }
  }

  const histogram = new Map();
  for (i = 0; i < output.length;) {
    if (output[i] < 0) {
      i += 2;
    } else {
      const count = 1 + output[i++];
      const end = i + count;
      if (count === 1) {
        bump(histogram, getQuad(output, i));
      }
      i = end;
    }
  }

  const mostFrequent = getMostFrequent(histogram);

  const quads = mostFrequent.map((q) => q[0]);
  const quadCount = quads.length;

  return [quadCount, ...quads.flatMap(toFourBytes), ...output];
}

export function decompress(input, size) {
  const output = new Uint8Array(size);
  let o = 0;
  let i = input[0] * 4 + 1;
  const repeats = {};
  const actuals = {};
  const quads = {};
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
      output[o++] = input[index * 4 + 1];
      output[o++] = input[index * 4 + 2];
      output[o++] = input[index * 4 + 3];
      output[o++] = input[index * 4 + 4];

      quads[index] ??= 0;
      quads[index]++;
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
