import { writeFile } from 'fs/promises';



await writeFile('./image.bin', new Uint8Array(30_000));