import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { nb } from "date-fns/locale/index.js";
import { request } from "https";
import dither from "./bayerDither.js";

process.env.TZ = "Europe/Amsterdam";

async function fetch() {
  console.log("request");

  const token =
    process.env.TIBBER_TOKEN ??
    (await import("./config.js").then((c) => c.default.token));

  return new Promise((res, rej) =>
    request(
      {
        hostname: "api.tibber.com",
        port: 443,
        path: "/v1-beta/gql",
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
      },
      (r) => {
        console.log(r.statusCode);
        let body = "";
        r.on("data", (chunk) => (body += chunk));
        r.on("end", () => {
          if (r.statusCode !== 200) return rej(body);
          try {
            res(JSON.parse(body));
          } catch (error) {
            rej(error);
          }
        });
      }
    )
      .on("error", rej)
      .end(
        JSON.stringify({
          operationName: null,
          variables: null,
          query: `{
      viewer {
        homes {
          consumption(resolution: HOURLY, last: 48) {
            nodes {
              from
              to
              cost
              unitPrice
              unitPriceVAT
              consumption
              consumptionUnit
              currency
            }
          }
          currentSubscription {
            status
            priceInfo {
              range(resolution: HOURLY, last: 48){
                nodes{
                  total
                  energy
                  tax
                  startsAt
                }
              }
              today {
                total
                energy
                tax
                startsAt
              }
              tomorrow {
                total
                energy
                tax
                startsAt
              }
            }
          }
        }
      }
    }`,
        })
      )
  );
}

export default async function drawChart() {
  const width = 800;
  const height = 480;

  const { data } = await fetch();

  const priceInfo = data.viewer.homes[0].currentSubscription.priceInfo;

  const prices = [
    ...priceInfo.range.nodes
      .filter((_) => priceInfo.tomorrow.length === 0)
      .filter((p) => p.startsAt < priceInfo.today[0].startsAt)
      .reverse()
      .filter((_, i) => i < 24)
      .reverse(),
    ...priceInfo.today,
    ...priceInfo.tomorrow,
  ];

  const consumption = data.viewer.homes[0].consumption.nodes
    .filter((d) => d.from >= prices[0].startsAt)
    .map(c => ({
      ...c,
      ...prices.find(p => p.startsAt === c.from)
    }));

  for (const c of consumption) {
    console.log(c.cost, (c.tax + c.energy) * c.consumption);
  }

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    plugins: {
      globalVariableLegacy: ["chartjs-adapter-date-fns"],
    },
    chartCallback(ChartJS) {
      ChartJS.defaults.font.family = "OpenSans";
      ChartJS.defaults.responsive = true;
      ChartJS.defaults.maintainAspectRatio = false;
    },
  });
  chartJSNodeCanvas.registerFont("./OpenSans-ExtraBold.ttf", {
    family: "OpenSans",
  });
  return toPixels(chartJSNodeCanvas.renderToBufferSync(
    {
      data: {
        datasets: [
          {
            type: "line",
            fill: "origin",
            label: "Strømpris",
            data: prices.map((d) => ({
              x: d.startsAt,
              y: d.total,
            })),
            borderColor: "red",
            backgroundColor: "pink",
            borderWidth: 3,
            tension: 0.5,
            pointRadius: 0,
            order: 3,
          },
          {
            type: "bar",
            label: "Forbruk",
            data: consumption
              .map((d) => ({
                x: offset(d.from),
                y: d.consumption * d.energy,
              })),
            borderColor: "black",
            backgroundColor: "grey",
            borderWidth: 2,
            order: 2,
            stack: 'consumption'
          },
          {
            type: "bar",
            label: "Forbruk",
            data: consumption
              .map((d) => ({
                x: offset(d.from),
                y: d.consumption * d.tax,
              })),
            borderColor: "black",
            backgroundColor: "grey",
            borderWidth: 2,
            order: 2,
            stack: 'consumption'
          },
        ],
      },
      options: {
        layout: {
          padding: {
            left: 0,
          },
        },
        scales: {
          xAxis: {
            alignToPixels: true,
            offset: false,
            grid: {
              offset: false,
              borderColor: "black",
              borderWidth: 2,
              color: "#888",
              tickColor: "black",
            },
            ticks: {
              color: "black",
            },
            type: "time",
            time: {
              stepSize: 3,
              displayFormats: {
                hour: "HH:mm",
              },
            },
            adapters: {
              date: {
                locale: nb,
              },
            },
          },
          yAxis: {
            alignToPixels: true,
            grid: {
              borderColor: "black",
              drawOnChartArea: true,
              borderWidth: 2,
              color: "#888",
              tickColor: "black",
            },
            ticks: {
              color: "black",
              callback(value) {
                return "kr " + value.toFixed(2);
              },
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
      plugins: [
        {
          id: "background-colour",
          beforeDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
            //ctx.translate(0.5, 0.5);
          },
          afterDraw: (chart) => {
            const ctx = chart.ctx;
            var imageData = ctx.getImageData(0, 0, width, height);
            dither(imageData, 4);
            ctx.putImageData(imageData, 0, 0);
          },
        },
      ],
    },
    "raw"
  ));
}

function offset(d) {
  d = new Date(d);
  d.setMinutes(30);
  return d.toISOString();
}

function toPixels(data, map = (x, y) => 480 * 800 - y * 800 - x) {
  const buffer = new Uint8Array(((800 * 480) / 8) * 2);
  var pixels = new Uint32Array(data.buffer);
  for (let y = 0; y < 480; y++) {
    for (let x = 0; x < 800; x++) {
      const i = map(x, y);
      const j = y * 800 + x;
      const bgr = pixels[i] & 0xffffff;
      if (bgr === 0xff0000) {
        buffer[48000 + Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      } else if (bgr === 0xffffff) {
        buffer[Math.floor(j / 8)] |= 1 << (7 - (j % 8));
      }
    }
  }
  return buffer;
}