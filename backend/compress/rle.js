//@ts-check

/**
 * @param {number[]} input
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
      while (i < input.length && i - from < 127) {
        if (input[i] === input[i + 1] && input[i] === input[i + 2]) break;
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
  let i = 0;
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
