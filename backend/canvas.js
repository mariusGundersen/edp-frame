// @ts-check

import { CanvasRenderingContext2D, createCanvas, registerFont } from "canvas";
import bayerDither from "./bayerDither.js";

const width = 800;
const height = 480;

registerFont("./OpenSans-ExtraBold.ttf", {
  family: "OpenSans Bold",
  weight: "bold",
});
registerFont("./OpenSans-Regular.ttf", {
  family: "OpenSans",
});

registerFont("./icons/yr-icons.ttf", {
  family: "yr-icons",
});

registerFont("./pixel.ttf", {
  family: "pixel",
});

/**
 *
 * @param {(canvas: CanvasRenderingContext2D) => (void | Promise<void>)} callback
 * @returns {Promise<Uint8Array>}
 */
export async function drawInCanvas(callback) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  ctx.textDrawingMode = 'glyph';

  await callback(ctx);

  const imageData = ctx.getImageData(0, 0, width, height);
  //pixelate(imageData);
  bayerDither(imageData, 4);
  ctx.putImageData(imageData, 0, 0);

  return canvas.toBuffer("raw");
}

/**
 * @param {import("canvas").ImageData} data
 */
function pixelate(data) {
  const pixels = new Uint32Array(data.data.buffer);
  for (let i = 0; i < pixels.length; i++) {
    let pixel = pixels[i] & 0xffffff;
    if (pixel === 0x000000) {
      // black;
    } else if (pixel === 0xffffff) {
      // white
    } else {

      pixels[i] = 0xff000000 | 0xffffff;// | (i % 2 ? 0xffffff : 0x000000);
    }
  }
}