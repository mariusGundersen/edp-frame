import canvas from "canvas";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { nb } from "date-fns/locale/index.js";
import dither from "./bayerDither.js";
import getDaylight from "./daylight.js";
import { fetchJson } from "./fetchJson.js";
import getWeather from "./weather.js";

process.env.TZ = "Europe/Amsterdam";
const width = 800;
const height = 480;

const chartJSNodeCanvas = (async function () {
  const image = await canvas.loadImage("./icons/weathertiles.png");

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

      class Daylight extends ChartJS.BarController {
        static id = "daylight";
        static defaults = ChartJS.BarController.defaults;
        draw() {
          const w = 16;
          const h = 32;
          const meta = this.getMeta();
          const data = this._data;
          let i = 0;

          for (const hour of meta.data) {
            const ctx = this.chart.ctx;
            const { x, y, width } = hour;
            const { time, light, phase } = data[i];

            ctx.save();

            const color = Math.floor(light * 0xff).toString(16);

            ctx.fillStyle = `#${color}${color}${color}`;

            ctx.fillRect(x - w / 2, h / 2 - 6, w, h + 6);

            if (i == 24) {
              const t = Math.PI * 2;
              const r = w / 2;
              const y = h - h / 4;
              ctx.beginPath();
              // 0    25   50   75   100
              // 🌑🌒🌓🌔🌕🌖🌗🌘🌑

              //left edge
              if (phase > 50) {
                ctx.ellipse(x - w / 2, y, r, r, t / 4, 0, t / 2, false);
              } else if (phase > 25) {
                const rx = (r * (phase - 25)) / 25;
                ctx.ellipse(x - w / 2, y, r, rx, t / 4, 0, t / 2, true);
              } else {
                const rx = (r * (25 - phase)) / 25;
                ctx.ellipse(x - w / 2, y, r, rx, t / 4, 0, t / 2, false);
              }
              //right edge
              if (phase <= 50) {
                ctx.ellipse(x - w / 2, y, r, r, t / 4, t / 2, 0, true);
              } else if (phase < 75) {
                const rx = (r * (75 - phase)) / 25;
                ctx.ellipse(x - w / 2, y, r, rx, t / 4, t / 2, 0, false);
              } else {
                const rx = (r * (phase - 75)) / 25;
                ctx.ellipse(x - w / 2, y, r, rx, t / 4, t / 2, 0, true);
              }

              ctx.fillStyle = "white";
              ctx.fill();
            }

            ctx.restore();

            i++;
          }
        }
      }

      class Weather extends ChartJS.BarController {
        static id = "weather";
        static defaults = ChartJS.BarController.defaults;
        draw() {
          const w = 16;
          const h = 32;
          const meta = this.getMeta();
          const data = this._data;
          let i = 0;

          const temperatures = data.map((d) => d.temperature);

          const maxTemp = temperatures.indexOf(Math.max(...temperatures));
          const minTemp = temperatures.indexOf(Math.min(...temperatures));

          const temps = [maxTemp, minTemp];

          if (maxTemp < minTemp) {
            temps.push(
              temperatures.indexOf(
                Math.max(...temperatures.slice(minTemp)),
                minTemp
              )
            );
          } else {
            temps.push(
              temperatures.indexOf(
                Math.min(...temperatures.slice(maxTemp)),
                maxTemp
              )
            );
          }

          for (const point of meta.data) {
            const ctx = this.chart.ctx;
            const { x, y, width } = point;
            const { tile, temperature, time } = data[i];

            ctx.save();

            /*ctx.textBaseline = 'top';
            ctx.font = `${width * 5}px yr`;
            ctx.textAlign = 'center';
            ctx.fillStyle = 'black';
            ctx.fillText(icon, x - width, 20);*/

            ctx.drawImage(
              image,
              tile[0] * w,
              tile[1] * h,
              w,
              h,
              x - w / 2,
              h / 2,
              w,
              h
            );

            if (temps.includes(i)) {
              ctx.fillStyle = "red";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.font = "18px OpenSans";
              ctx.fillText(`${Math.round(temperature)}°C`, x - w / 2, h * 1.5);
            }

            ctx.restore();
            i++;
          }
        }
      }

      ChartJS.register(Weather);
      ChartJS.register(Daylight);
    },
  });
  chartJSNodeCanvas.registerFont("./OpenSans-ExtraBold.ttf", {
    family: "OpenSans",
  });
  chartJSNodeCanvas.registerFont("./icons/yr-icons.ttf", {
    family: "yr",
  });

  return chartJSNodeCanvas;
})();

async function getElectricity() {
  const token =
    process.env.TIBBER_TOKEN ??
    (await import("./config.js").then((c) => c.default.token));

  return await fetchJson(
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
  );
}

export default async function drawChart() {
  const { data } = await getElectricity();

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
    .map((c) => ({
      ...c,
      ...prices.find((p) => p.startsAt === c.from),
    }));

  const weather = await getWeather(
    prices[0].startsAt,
    prices[prices.length - 1].startsAt
  );

  const sun = await getDaylight(
    prices[0].startsAt.replace(/T.*/, ""),
    new Date().getTimezoneOffset() == -120 ? "+02:00" : "+01:00"
  );

  const daylight = prices.map((p, i, prices) => ({
    time: p.startsAt,
    phase: sun[0].moonphase,
    light: sun
      .map((sun) =>
        p.startsAt >= sun.sunrise && prices[i + 1]?.startsAt < sun.sunset
          ? 1
          : p.startsAt < sun.sunrise && prices[i + 1]?.startsAt >= sun.sunrise
          ? 0.5
          : p.startsAt < sun.sunset && prices[i + 1]?.startsAt > sun.sunset
          ? 0.5
          : 0
      )
      .reduce((a, b) => a + b, 0),
  }));

  const maxPrice = Math.max(...prices.map((p) => p.total));

  const weatherPrice = maxPrice + (maxPrice / 440) * 45;

  const buffer = (await chartJSNodeCanvas).renderToBufferSync(
    {
      data: {
        datasets: [
          {
            type: "line",
            fill: "origin",
            label: "Strømpris",
            data: prices
              .reduce(
                (prices, price) => [
                  ...prices,
                  {
                    ...price,
                    startsAt: price.startsAt.replace("00:00.", "10:00."),
                  },
                  {
                    ...price,
                    startsAt: price.startsAt.replace("00:00.", "50:00."),
                  },
                ],
                []
              )
              .map((d) => ({
                x: d.startsAt,
                y: d.total,
              })),
            borderColor: "red",
            backgroundColor: "pink",
            borderWidth: 3,
            tension: 0,
            pointRadius: 0,
            order: 3,
          },
          {
            type: "bar",
            label: "Forbruk",
            data: consumption.map((d) => ({
              x: offset(d.from),
              y: d.consumption * d.energy,
            })),
            borderColor: "black",
            backgroundColor: "grey",
            borderWidth: 2,
            order: 2,
            stack: "consumption",
          },
          {
            type: "bar",
            label: "Forbruk",
            data: consumption.map((d) => ({
              x: offset(d.from),
              y: d.consumption * d.tax,
            })),
            borderColor: "black",
            backgroundColor: "grey",
            borderWidth: 2,
            order: 2,
            stack: "consumption",
          },
          {
            type: "daylight",
            data: daylight.map((d) => ({
              ...d,
              x: offset(d.time, 0, 0),
              y: 0,
            })),
            order: 4,
          },
          {
            type: "weather",
            data: weather.map((d) => ({
              ...d,
              x: offset(d.time, 0, 0),
              y: weatherPrice,
            })),
            barPercentage: 1,
            categoryPercentage: 1,
            order: 3,
          },
        ],
      },
      options: {
        layout: {
          padding: {
            left: 6,
            top: 0,
            right: 0,
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
                hour: "HH",
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
                return value.toFixed(2);
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
  );

  return toPixels(buffer);
}

function offset(d, minutes = 30, hours = 0) {
  d = new Date(d);
  d.setMinutes(30);
  d.setHours(d.getHours() + hours);
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
