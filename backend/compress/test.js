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