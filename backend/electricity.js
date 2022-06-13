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
                  startsAt
                }
              }
              today {
                total
                startsAt
              }
              tomorrow {
                total
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

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    plugins: {
      globalVariableLegacy: ["chartjs-adapter-date-fns"],
    },
    chartCallback(ChartJS) {
      ChartJS.defaults.font.family = "OpenSans-Regular";
      ChartJS.defaults.responsive = true;
      ChartJS.defaults.maintainAspectRatio = false;
    },
  });
  chartJSNodeCanvas.registerFont("./OpenSans-ExtraBold.ttf", {
    family: "OpenSans-Regular",
  });
  return chartJSNodeCanvas.renderToStream(
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
            data: data.viewer.homes[0].consumption.nodes
              .filter((d) => d.from >= prices[0].startsAt)
              .map((d) => ({
                x: offset(d.from),
                y: d.cost,
              })),
            borderColor: "grey",
            backgroundColor: "grey",
            borderWidth: 2,
            order: 2,
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
        /*{
          afterDraw: (chart) => {
            var xAxis = chart.scales["xAxis"];
            console.log("xAxis", typeof xAxis);
            var tickDistance = xAxis.width / (xAxis.ticks.length - 1);
            xAxis.ticks.forEach((value, index) => {
              if (index > 0) {
                var x =
                  -tickDistance + tickDistance * 0.66 + tickDistance * index;
                var y = chart.height - 10;
                chart.ctx.save();
                chart.ctx.fillText(value.label, x, y);
                chart.ctx.restore();
              }
            });
          },
        },*/
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
    "image/png"
  );
}

function offset(d) {
  d = new Date(d);
  d.setMinutes(30);
  return d.toISOString();
}
