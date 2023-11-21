//@ts-check

/**
 * @param {number[] | Uint8Array} input
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
  while (o < size) {
    if (input[i] < 0) {
      for (let repeat = 1 - input[i++]; repeat > 0; repeat--) {
        output[o++] = input[i];
      }
      i++;
    } else {
      for (let actual = 1 + input[i++]; actual > 0; actual--) {
        output[o++] = input[i++];
      }
    }
  }

  return output;
}

export function streamDecompress(size, callback) {
  const CHUNK_LENGTH = 256;
  const chunk = new Uint8Array(CHUNK_LENGTH);

  let c = 0;
  let o = 0;
  let repeat = 0;
  let actual = 0;

  return input => {
    for (let i = 0; i < input.length;) {
      if (o + c >= size) {
        return;
      } else if (repeat > 0) {
        chunk[c++] = input[i];
        repeat--;
        if (repeat === 0) i++;
      } else if (actual > 0) {
        chunk[c++] = input[i++];
        actual--;
      } else if (input[i] < 0) {
        repeat = 1 - input[i++];
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


