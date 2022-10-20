import { fetchJson } from "./fetchJson.js";

export default async function getDaylight(date, offset) {
  const json = await fetchJson({
    hostname: "api.met.no",
    port: 443,
    path: `/weatherapi/sunrise/2.0/.json?lat=59.917&lon=10.817&date=${date}&offset=${offset}&days=2`,
    method: "GET",
    headers: {
      "User-Agent": "https://github.com/mariusGundersen/edp-frame",
    },
  });

  return json.location.time
    .filter((t) => t.sunrise)
    .map((t) => ({
      sunrise: t.sunrise.time,
      sunset: t.sunset.time,
    }));
}
