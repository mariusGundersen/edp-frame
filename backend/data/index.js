import drawChart from '../electricity.js';

export default async function (context, req) {

  const chart = await drawChart();
  
  context.res = {
    body: "hello",
  };
}
