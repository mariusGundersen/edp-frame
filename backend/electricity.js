import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import { nb } from "date-fns/locale/index.js";
import dither, { sierra } from "./dither.js";

export default function drawChart() {
  const width = 800;
  const height = 480;
  const configuration = {
    type: "bar",
    data: {
      datasets: [
        {
          label: "Strømpris",
          data: [
            {
              y: 2.3376,
              energy: 1.8621,
              tax: 0.4755,
              x: "2022-05-19T00:00:00.000+02:00",
            },
            {
              y: 2.2995,
              energy: 1.8316,
              tax: 0.4679,
              x: "2022-05-19T01:00:00.000+02:00",
            },
            {
              y: 2.2414,
              energy: 1.7851,
              tax: 0.4563,
              x: "2022-05-19T02:00:00.000+02:00",
            },
            {
              y: 2.198,
              energy: 1.7504,
              tax: 0.4476,
              x: "2022-05-19T03:00:00.000+02:00",
            },
            {
              y: 2.2192,
              energy: 1.7674,
              tax: 0.4518,
              x: "2022-05-19T04:00:00.000+02:00",
            },
            {
              y: 2.2979,
              energy: 1.8303,
              tax: 0.4676,
              x: "2022-05-19T05:00:00.000+02:00",
            },
            {
              y: 2.3737,
              energy: 1.8909,
              tax: 0.4828,
              x: "2022-05-19T06:00:00.000+02:00",
            },
            {
              y: 2.8602,
              energy: 2.2802,
              tax: 0.58,
              x: "2022-05-19T07:00:00.000+02:00",
            },
            {
              y: 2.8493,
              energy: 2.2715,
              tax: 0.5778,
              x: "2022-05-19T08:00:00.000+02:00",
            },
            {
              y: 2.7772,
              energy: 2.2138,
              tax: 0.5634,
              x: "2022-05-19T09:00:00.000+02:00",
            },
            {
              y: 2.5101,
              energy: 2,
              tax: 0.5101,
              x: "2022-05-19T10:00:00.000+02:00",
            },
            {
              y: 2.3409,
              energy: 1.8648,
              tax: 0.4761,
              x: "2022-05-19T11:00:00.000+02:00",
            },
            {
              y: 2.3193,
              energy: 1.8475,
              tax: 0.4718,
              x: "2022-05-19T12:00:00.000+02:00",
            },
            {
              y: 2.2954,
              energy: 1.8283,
              tax: 0.4671,
              x: "2022-05-19T13:00:00.000+02:00",
            },
            {
              y: 2.2624,
              energy: 1.802,
              tax: 0.4604,
              x: "2022-05-19T14:00:00.000+02:00",
            },
            {
              y: 2.3308,
              energy: 1.8567,
              tax: 0.4741,
              x: "2022-05-19T15:00:00.000+02:00",
            },
            {
              y: 2.4465,
              energy: 1.9492,
              tax: 0.4973,
              x: "2022-05-19T16:00:00.000+02:00",
            },
            {
              y: 2.5754,
              energy: 2.0523,
              tax: 0.5231,
              x: "2022-05-19T17:00:00.000+02:00",
            },
            {
              y: 2.5753,
              energy: 2.0522,
              tax: 0.5231,
              x: "2022-05-19T18:00:00.000+02:00",
            },
            {
              y: 2.468,
              energy: 1.9664,
              tax: 0.5016,
              x: "2022-05-19T19:00:00.000+02:00",
            },
            {
              y: 2.5144,
              energy: 2.0035,
              tax: 0.5109,
              x: "2022-05-19T20:00:00.000+02:00",
            },
            {
              y: 2.5157,
              energy: 2.0046,
              tax: 0.5111,
              x: "2022-05-19T21:00:00.000+02:00",
            },
            {
              y: 2.4419,
              energy: 1.9455,
              tax: 0.4964,
              x: "2022-05-19T22:00:00.000+02:00",
            },
            {
              y: 2.3366,
              energy: 1.8613,
              tax: 0.4753,
              x: "2022-05-19T23:00:00.000+02:00",
            },
            {
              y: 2.2909,
              energy: 1.8247,
              tax: 0.4662,
              x: "2022-05-20T00:00:00.000+02:00",
            },
            {
              y: 2.2149,
              energy: 1.764,
              tax: 0.4509,
              x: "2022-05-20T01:00:00.000+02:00",
            },
            {
              y: 2.191,
              energy: 1.7448,
              tax: 0.4462,
              x: "2022-05-20T02:00:00.000+02:00",
            },
            {
              y: 2.2007,
              energy: 1.7526,
              tax: 0.4481,
              x: "2022-05-20T03:00:00.000+02:00",
            },
            {
              y: 2.2252,
              energy: 1.7721,
              tax: 0.4531,
              x: "2022-05-20T04:00:00.000+02:00",
            },
            {
              y: 2.2716,
              energy: 1.8093,
              tax: 0.4623,
              x: "2022-05-20T05:00:00.000+02:00",
            },
            {
              y: 2.3751,
              energy: 1.8921,
              tax: 0.483,
              x: "2022-05-20T06:00:00.000+02:00",
            },
            {
              y: 2.4644,
              energy: 1.9635,
              tax: 0.5009,
              x: "2022-05-20T07:00:00.000+02:00",
            },
            {
              y: 2.6258,
              energy: 2.0926,
              tax: 0.5332,
              x: "2022-05-20T08:00:00.000+02:00",
            },
            {
              y: 2.5664,
              energy: 2.0452,
              tax: 0.5212,
              x: "2022-05-20T09:00:00.000+02:00",
            },
            {
              y: 2.5681,
              energy: 2.0465,
              tax: 0.5216,
              x: "2022-05-20T10:00:00.000+02:00",
            },
            {
              y: 2.5305,
              energy: 2.0164,
              tax: 0.5141,
              x: "2022-05-20T11:00:00.000+02:00",
            },
            {
              y: 2.4811,
              energy: 1.9768,
              tax: 0.5043,
              x: "2022-05-20T12:00:00.000+02:00",
            },
            {
              y: 2.3893,
              energy: 1.9035,
              tax: 0.4858,
              x: "2022-05-20T13:00:00.000+02:00",
            },
            {
              y: 2.3348,
              energy: 1.8599,
              tax: 0.4749,
              x: "2022-05-20T14:00:00.000+02:00",
            },
            {
              y: 2.3744,
              energy: 1.8915,
              tax: 0.4829,
              x: "2022-05-20T15:00:00.000+02:00",
            },
            {
              y: 2.3884,
              energy: 1.9028,
              tax: 0.4856,
              x: "2022-05-20T16:00:00.000+02:00",
            },
            {
              y: 2.4039,
              energy: 1.9152,
              tax: 0.4887,
              x: "2022-05-20T17:00:00.000+02:00",
            },
            {
              y: 2.4158,
              energy: 1.9247,
              tax: 0.4911,
              x: "2022-05-20T18:00:00.000+02:00",
            },
            {
              y: 2.388,
              energy: 1.9024,
              tax: 0.4856,
              x: "2022-05-20T19:00:00.000+02:00",
            },
            {
              y: 2.3812,
              energy: 1.897,
              tax: 0.4842,
              x: "2022-05-20T20:00:00.000+02:00",
            },
            {
              y: 2.3625,
              energy: 1.882,
              tax: 0.4805,
              x: "2022-05-20T21:00:00.000+02:00",
            },
            {
              y: 2.314,
              energy: 1.8432,
              tax: 0.4708,
              x: "2022-05-20T22:00:00.000+02:00",
            },
            {
              y: 2.2215,
              energy: 1.7692,
              tax: 0.4523,
              x: "2022-05-20T23:00:00.000+02:00",
            },
          ],
          backgroundColor: "rgba(255, 99, 132, 1)",
          borderColor: "rgba(255,99,132,1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        xAxis: {
          type: "time",
          time: {
            unit: "hour",
          },
          adapters: {
            date: {
              locale: nb,
            },
          },
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
          dither(imageData, sierra);
          ctx.putImageData(imageData, 0, 0);
        },
      },
    ],
  };
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
  return chartJSNodeCanvas.renderToStream(configuration, "image/png");
}
