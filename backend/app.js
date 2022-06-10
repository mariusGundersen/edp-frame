import express from "express";
import * as fs from "fs";
import { PNG } from "pngjs";
import dither, { sierra } from "./dither.js";
import drawChart from "./electricity.js";

const app = express();
//app.use(express.static("."));
app.get("/chart", async (req, res) => {
  drawChart().then((c) => c.pipe(res));
});
app.get("/data", async (req, res) => {
  drawChart().then((c) =>
    c.pipe(new PNG()).on("parsed", function () {
      const buffer = toPixels(this.data);
      res.end(Buffer.from(buffer), "binary");
    })
  );
});
app.get("/image/data", (req, res) => {
  fs.createReadStream("./in.png")
    .pipe(new PNG())
    .on("parsed", function () {
      dither(this, sierra);

      const buffer = toPixels(this.data); //, (x, y) => x * 800 + y);

      res.end(Buffer.from(buffer), "binary");
    });
});
app.get("/image", (req, res) => {
  fs.createReadStream("./in.png")
    .pipe(new PNG())
    .on("parsed", function (data) {
      dither(this, sierra);

      this.pack().pipe(res);
    });
});
app.get("/data2", (req, res) => {
  console.log("get data");
  let buffer = new Uint8Array(((800 * 480) / 8) * 2);

  for (let y = 120; y < 360; y++) {
    for (let x = 25; x < 75; x++) {
      buffer[y * 100 + x] = 0xff;
    }
  }

  for (let y = 480 + 180; y < 480 + 300; y++) {
    for (let x = 40; x < 60; x++) {
      buffer[y * 100 + x] = 0xff;
    }
  }

  res.end(Buffer.from(buffer), "binary");
});
app.get("/", (req, res) => res.end("hello"));

export default app;

function toPixels(data, map = (x, y) => 480 * 800 - y * 800 - x) {
  const buffer = new Uint8Array(((800 * 480) / 8) * 2);
  var pixels = new Uint32Array(data.buffer);

  /*



  */

  for (let y = 0; y < 480; y++) {
    for (let x = 0; x < 800; x++) {
      const i = map(x, y);
      const j = y * 800 + x;
      const bgr = pixels[i] & 0xffffff;
      if (bgr === 0x0000ff) {
        buffer[48000 + Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      } else if (bgr === 0xffffff) {
        buffer[Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      }
    }
  }
  return buffer;
}
