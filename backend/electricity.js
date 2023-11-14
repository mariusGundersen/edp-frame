import { createCanvas, loadImage, registerFont } from "canvas";
import { BarController, Chart } from "chart.js/auto";
import 'chartjs-adapter-date-fns';
import { nb } from "date-fns/locale/index.js";
import dither from "./bayerDither.js";
import getDaylight from "./daylight.js";
import { fetchJson } from "./fetchJson.js";
import getWeather from "./weather.js";

process.env.TZ = "Europe/Amsterdam";
const width = 800;
const height = 480;


const image = await loadImage("./icons/weathertiles.png");


const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

Chart.defaults.font.family = "OpenSans";
Chart.defaults.responsive = true;
Chart.defaults.maintainAspectRatio = false;

class Daylight extends BarController {
  static id = "daylight";
  static defaults = BarController.defaults;
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

      if (light === 0.5) {
        const gradient = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        gradient.addColorStop(0, "black");
        gradient.addColorStop(1, "white");
        ctx.fillStyle = gradient;
      } else if (light === -0.5) {
        const gradient = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
        gradient.addColorStop(0, "white");
        gradient.addColorStop(1, "black");
        ctx.fillStyle = gradient;
      } else if (light === 1) {
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#000000';
      }

      ctx.fillRect(x - w / 2, h / 2 - 6, w, h + 6);

      if (i == 24) {
        const t = Math.PI * 2;
        const r = w / 2;
        const y = h - h / 4;

        const semillipse = (rx = r, second = false) =>
          ctx.ellipse(
            x - w / 2,
            y,
            r,
            Math.abs(rx),
            t / 4,
            second ? t / 2 : 0,
            second ? 0 : t / 2,
            rx < 0
          );

        ctx.beginPath();
        // 0    25   50   75   100
        // 🌑🌒🌓🌔🌕🌖🌗🌘🌑

        //left edge
        if (phase > 50) {
          semillipse(r);
        } else {
          const rx = (r * (phase - 25)) / 25;
          semillipse(rx);
        }

        //right edge
        if (phase <= 50) {
          semillipse(r, true);
        } else {
          const rx = (r * (75 - phase)) / 25;
          semillipse(rx, true);
        }

        ctx.fillStyle = "white";
        ctx.fill();
      }

      ctx.restore();

      i++;
    }
  }
}

class Weather extends BarController {
  static id = "weather";
  static defaults = BarController.defaults;
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

Chart.register(Weather);
Chart.register(Daylight);
registerFont("./OpenSans-ExtraBold.ttf", {
  family: "OpenSans",
});
registerFont("./icons/yr-icons.ttf", {
  family: "yr",
});

async function getElectricity() {
  const token =
    process.env.TIBBER_TOKEN ??
    (await import("./config.js").then((c) => c.default.token));

  return await fetchJson("https://api.tibber.com/v1-beta/gql",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
    });
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
    prices.map(p => p.startsAt).filter(t => /T00:00:00/.test(t))
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
              ? -0.5
              : 0
      )
      .reduce((a, b) => a + b, 0),
  }));

  const maxPrice = Math.max(...prices.map((p) => p.total));

  const weatherPrice = maxPrice + (maxPrice / 440) * 45;

  const config = {
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
        x: {
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
        y: {
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
  };

  const chart = new Chart(ctx, config);

  const buffer = canvas.toBuffer("raw");

  chart.destroy();

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
