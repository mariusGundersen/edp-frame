import express from "express";
import { PNG } from "pngjs";
import drawChart from "./electricity.js";

const app = express()
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
  .use(express.static("."))
  .get("/", (req, res) => res.end("hello"));

export default app;

