
//@ts-check

import { bump, getMostFrequent } from "./utils.js";

/**
 * @param {number[]} input
 * @returns {number[]}
 */
export function compress(input) {
  const output = [];
  let o = 0;
  let i = 0;

  const histogram = new Map();

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

      const count = i - from;
      if (count === 0) {
        const value = output[headerPos + 1];
        output[headerPos] = `${value}`;
        bump(histogram, value);
        o--;
      } else {
        output[headerPos] = i - from;
      }
    }
  }

  const mostFrequentSingles = getMostFrequent(histogram, 64, 1).map((a) =>
    a[0].toString()
  );
  for (o = 0; o < output.length; o++) {
    const byte = output[o];
    if (typeof byte === "string") {
      const index = mostFrequentSingles.indexOf(byte);
      if (index >= 0) {
        output[o] = 64 + index;
      } else {
        output.splice(o, 1, 0, parseInt(byte));
      }
    }
  }

  return [
    mostFrequentSingles.length,
    ...mostFrequentSingles.map((o) => parseInt(o)),
    ...output,
  ];
}

/**
 * @param {number[]} input
 * @param {number} size
 */
export function decompress(input, size) {
  const output = new Uint8Array(size);
  let o = 0;
  let i = input[0] + 1;
  const repeats = {};
  const actuals = {};
  const singles = {};
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
      output[o++] = input[index + 1];

      singles[index] ??= 0;
      singles[index]++;
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
