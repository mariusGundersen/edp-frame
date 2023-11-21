//@ts-check
import { readFile } from 'fs/promises';
import assert from 'node:assert';
import test from 'node:test';
import * as lz77 from './lz77.js';
import * as quad from './quad.js';
import * as quadOld from './quadOld.js';
import * as rle from './rle.js';
import * as singles from './singles.js';

const input = new Uint8Array(await readFile('./compress/data.bin'));

check("rle", rle, input);
checkStream("rle stream", rle, input);
check("quad", quad, input);
check("quadOld", quadOld, input);
check("singles", singles, input);
check("lz77", lz77, input);
check("lzz+rle", lz77, new Uint8Array(rle.compress(input)));

test('lz77 basic', () => {
  assert.deepStrictEqual(lz77.compress([1]), [0, 0, 1]);
  assert.deepStrictEqual(lz77.compress([-1, 2]), [1, 0, -1, 2]);
  assert.deepStrictEqual(lz77.compress([1, 1]), [0, 0, 1, 0, 1, 1]);
  assert.deepStrictEqual(lz77.compress([1, 1, 1, 1]), [0, 0, 1, 0, 3, 1]);
  assert.deepStrictEqual(lz77.compress([1, 2, 3, 1, 2, 3]), [2, 0, 1, 2, 3, 2, 3, 3]);
  assert.deepStrictEqual(lz77.compress([1, 2, 3, 1, 4, 5]), [2, 0, 1, 2, 3, 2, 1, 4, 0, 0, 5]);
});


/**
 * @param {string} name
 * @param {{
*   compress(input: number[] | Uint8Array): number[],
*   streamDecompress(size: number, callback: (output: Uint8Array) => void): (chunk: number[] | Uint8Array) => void;
* }} algorithm
* @param {number[] | Uint8Array} input
*/
function checkStream(name, { compress, streamDecompress }, input) {
  check(name, {
    compress, decompress(data, size) {
      const output = new Uint8Array(size);
      let c = 0;
      const call = streamDecompress(size, chunk => {
        output.set(chunk, c);
        c += chunk.length;
      });

      for (let i = 0; i < data.length;) {
        const l = Math.floor(Math.random() * 50) * 150;
        call(data.slice(i, i + l));
        i += l;
      }

      return output;
    }
  }, input);
}

/**
 * @param {string} name
 * @param {{
 *   compress(input: number[] | Uint8Array): number[],
 *   decompress(input: number[] | Uint8Array, size: number): Uint8Array
 * }} algorithm
 * @param {number[] | Uint8Array} input
 */
function check(name, { compress, decompress }, input) {
  test(name, () => {
    const compressed = compress(input);
    const output = decompress(compressed, input.length);

    assert.equal(output.length, input.length,
      `Lengths don't match! ${input.length} !== ${output.length}`
    );

    for (let i = 0; i < input.length; i++) {
      assert.equal(output[i], input[i],
        `Mismatched at index ${i}, ${input[i]} !== ${output[i]}`
      );
    }

    assert.deepStrictEqual(output, input);

    console.log(
      `${name}: from ${input.length} to ${compressed.length
      }, down to ${((compressed.length / input.length) * 100).toFixed(0)}%`
    );
  });
}