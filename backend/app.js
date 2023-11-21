import bodyParser from "body-parser";
import express from "express";
import { PNG } from "pngjs";
import * as quad from './compress/quadOld.js';
import * as rle from './compress/rle.js';
import drawChart from "./electricity.js";

const app = express()
  .use(bodyParser.text({ type: "*/*" }))
  .get("/chart", async (req, res) => {
    drawChart().then((c) => {
      const png = new PNG({ width: 800, height: 480 });
      png.data = c;
      png.pack().pipe(res)
    });
  })
  .get("/data", async (req, res) => {
    res.end(Buffer.from(await drawChart()), "binary");
  })
  .get("/data/rle", async (req, res) => {
    res.end(Buffer.from(rle.compress(await drawChart())), "binary");
  })
  .get("/data/quad", async (req, res) => {
    res.end(Buffer.from(quad.compress(await drawChart())), "binary");
  })
  .post("/data", async (req, res) => {
    console.log("posted to data");
    console.log(req.body);
    console.log("---end---");
    res.end(Buffer.from(await drawChart()), "binary");
  })
  .use(express.static("."))
  .get("/", (req, res) => res.end("hello"));

export default app;

