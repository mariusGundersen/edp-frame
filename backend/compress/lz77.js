//@ts-check

/**
 * @param {number[]} input
 */
export function compress(input) {
  const output = [0, 0, input[0]];
  let literalLength = 1;
  for (let i = 1; i < input.length; i++) {
    let byte = input[i];
    let window = range(i - 1).filter(d => input[d] === byte);
    if (window.length === 0) {
      if (literalLength > 0 && literalLength < 255) {
        output[output.length - literalLength - 2]++;
        output.push(byte);
        literalLength++;
      } else {
        output.push(0, 0, byte);
        literalLength = 1;
      }
    } else {
      literalLength = 0;
      let l = 0;
      for (; l < 256 && i + l - input.length; l++) {
        byte = input[i + l];
        const nextWindow = window.filter(d => input[d + l] === byte);
        if (nextWindow.length === 0) break;
        window = nextWindow;
      }

      output.push(i - 1 - window[0], l, byte);
      i += l;
    }

    // depth, length, byte
    // 0, 0, x
    // 1, 4, x
    // 0, 4, x
    // 4, 0, abcde
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
  for (let i = 0; i < input.length; i += 3) {
    const d = input[i];
    const l = input[i + 1];
    let b = input[i + 2];
    if (l > 0) {
      for (let x = 0; x < l; x++) {
        output[o++] = output[o - 2 - d];
      }
    } else {
      for (let x = 0; x < d; x++) {
        if (o === size) break;
        output[o++] = b;
        b = input[++i + 2];
      }
    }
    if (o === size) break;
    output[o++] = b;
  }

  return output;
}

/**
 * @param {number} index
 */
function range(index) {
  const array = [];
  for (let i = Math.max(0 - index, index - 255); i <= 0; i++) {
    array.push(index + i);
  }

  return array;
}