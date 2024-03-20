import bodyParser from "body-parser";
import express from "express";
import expressBasicAuth from "express-basic-auth";
import { PNG } from "pngjs";
import drawCalendar from "./calendar.js";
import * as quad from './compress/quadOld.js';
import * as rle from './compress/rle.js';
import drawElectricity from './electricity.js';
import { getConfig } from "./getConfig.js";
import toPixels from './toPixels.js';

const app = express()
  .use(bodyParser.text({ type: "*/*" }))
  .use(expressBasicAuth({
    users: await getConfig().then(c => c.users),
    challenge: true,
    realm: 'edp'
  }))
  .get("/calendar", async (req, res) => toPngStream(await drawCalendar()).pipe(res))
  .get("/electricity", async (req, res) => toPngStream(await drawElectricity()).pipe(res))
  .get("/data", async (req, res) => res.end(toPixels(await drawCalendar(req.query.battery)), "binary"))
  .get("/data/rle", async (req, res) => res.end(toPixels(rle.compress(await drawElectricity())), "binary"))
  .get("/data/quad", async (req, res) => res.end(toPixels(quad.compress(await drawElectricity())), "binary"))
  .post("/data", async (req, res) => {
    console.log("posted to data");
    console.log(req.body);
    console.log("---end---");
    res.end(toPixels(await drawElectricity()), "binary");
  })
  .use(express.static("."))
  .get("/", (req, res) => res.end("hello"));

export default app;

function toPngStream(data) {
  const png = new PNG({ width: 800, height: 480 });
  png.data = data;
  return png.pack();
}