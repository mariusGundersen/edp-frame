import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { nb } from "date-fns/locale/index.js";
import { request } from 'https';
import dither from "./bayerDither.js";
import config from './config.js';

function fetch() {

  console.log('request');

  return new Promise((res, rej) => request({
    hostname: 'api.tibber.com',
    port: 443,
    path: '/v1-beta/gql',
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + config.token,
      'Content-Type': 'application/json'
    }
  }, r => {
    console.log(r.statusCode);
    let body = '';
    r.on('data', chunk => body += chunk);
    r.on('end', () => {
      if (r.statusCode !== 200)
        return rej(body);
      try {
        res(JSON.parse(body));
      } catch (error) {
        rej(error);
      }
    })
  }).on("error", rej).end(JSON.stringify({
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
    }`
  })));
}

export default async function drawChart() {
  const width = 800;
  const height = 480;

  const { data } = await fetch();

  const prices = [
    ...data.viewer.homes[0].currentSubscription.priceInfo.today,
    ...data.viewer.homes[0].currentSubscription.priceInfo.tomorrow
  ];

  const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width,
    height,
    plugins: {
      globalVariableLegacy: ["chartjs-adapter-date-fns"],
    },
    chartCallback(ChartJS) {
      ChartJS.defaults.font.family = "sans-serif";
      ChartJS.defaults.font.weight = "bold";
      ChartJS.defaults.responsive = true;
      ChartJS.defaults.maintainAspectRatio = false;
    },
  });
  return chartJSNodeCanvas.renderToStream({
    data: {
      datasets: [
        {
          type: "line",
          label: "Strømpris",
          data: prices.map(d => ({
            x: d.startsAt,
            y: d.total
          })),
          borderColor: "red",
          borderWidth: 3,
          tension: 0.5,
          pointRadius: 0
        },
        {
          type: 'bar',
          label: "Forbruk",
          data: data.viewer.homes[0].consumption.nodes.filter(d => d.from >= prices[0].startsAt).map(d => ({
            x: d.from,
            y: d.cost
          })),
          borderColor: "black",
          backgroundColor: 'grey',
          borderWidth: 2,
        },
      ],
    },
    options: {
      layout: {
        padding: {
          left: 0
        }
      },
      scales: {
        xAxis: {
          alignToPixels: true,
          grid: {
            borderColor: 'black',
            color: '#888',
            tickColor: 'black'
          },
          ticks: {
            color: 'black'
          },
          type: "time",
          time: {
            stepSize: 3,
            displayFormats: {
              'hour': 'HH:mm'
            }
          },
          adapters: {
            date: {
              locale: nb,
            },
          }
        },
        yAxis: {
          alignToPixels: true,
          grid: {
            borderColor: 'black',
            color: '#888',
            tickColor: 'black'
          },
          ticks: {
            color: 'black',
            callback(value) {
              return 'kr ' + value.toFixed(2)
            }
          },

        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
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
  }, "image/png");
}
