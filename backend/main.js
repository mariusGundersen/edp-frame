// @ts-check
import { app } from "@azure/functions";
import * as quad from './compress/quadOld.js';
import * as rle from "./compress/rle.js";
import drawChart from "./electricity.js";

app.http("data", {
  route: "data",
  methods: ["GET"],
  async handler(request, context) {
    return { body: await drawChart() };
  },
  authLevel: "anonymous"
});

app.http("data-rle", {
  route: "data/rle",
  methods: ["GET"],
  async handler(request, context) {
    return { body: new Uint8Array(rle.compress(await drawChart())) };
  },
  authLevel: "anonymous"
});

app.http("data-rle-quad", {
  route: "data/quad",
  methods: ["GET"],
  async handler(request, context) {
    return { body: new Uint8Array(quad.compress(await drawChart())) };
  },
  authLevel: "anonymous"
});