import express from "express";
import * as fs from "fs";
import { PNG } from "pngjs";
import dither, { sierra } from "./dither.js";
import drawChart from "./electricity.js";

var app = express();

app.use(express.static("."));

app.get("/chart", async (req, res) => {
  drawChart().pipe(res);
});

app.get("/chart/pixels", async (req, res) => {
  drawChart()
    .pipe(new PNG())
    .on("parsed", (data) => {
      let buffer = new Uint8Array(((800 * 480) / 8) * 2);

      var pixels = new Uint32Array(data);
      for (var i = 0; i < pixels.length; i++) {
        const rgb = pixels[i] >> 8;
        if (rgb == 0xff0000) {
          buffer[48000 + Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        } else if ((rgb = 0xffffff)) {
          buffer[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        }
      }
      /*for (var i = 0; i < data.length / 4; i++) {
        if (data[i * 4] == 0xff && data[i * 4 + 1] == 0x00) {
          buffer[48000 + Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        } else if (data[i * 4] == 0xff && data[i * 4 + 1] == 0xff) {
          buffer[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        }
      }*/

      res.end(Buffer.from(buffer), "binary");
    });
});

app.get("/data", (req, res) => {
  fs.createReadStream("./in.png")
    .pipe(new PNG())
    .on("parsed", function (data) {
      const buffer = new Uint8Array(((800 * 480) / 8) * 2);

      for (let i = 0; i < data.length / 4; i++) {
        const rgb =
          (data[i * 4] << 16) | (data[i * 4 + 1] << 8) | data[i * 4 + 2];
        const j = data.length / 4 - i;
        if (rgb === 0xff0000) {
          buffer[48000 + Math.floor(j / 8)] |= 1 << (7 - (j % 8));
        } else if (rgb === 0xffffff) {
          buffer[Math.floor(j / 8)] |= 1 << (7 - (j % 8));
        }
      }

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

app.listen(8080, () => console.log("listening"));
