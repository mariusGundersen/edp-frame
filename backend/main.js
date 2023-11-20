import { app } from "@azure/functions";
import drawChart from "./electricity.js";

app.http("data", {
  methods: ["GET", "POST"],
  async handler(request, context) {
    return { body: await drawChart() };
  }
})