import { fetchJson } from "./fetchJson.js";

export default async function getDaylight(dates) {
  return await Promise.all(
    dates.map(d => getSunAndMoon(
      d.replace(/T.*/, ''),
      d.replace(/^.*\+/, '+')))
  );
}

async function getSunAndMoon(date, offset) {
  const sun = await fetchJson(`https://api.met.no/weatherapi/sunrise/3.0/sun?lat=59.917&lon=10.817&date=${date}&offset=${offset}`);
  const moon = await fetchJson(`https://api.met.no/weatherapi/sunrise/3.0/moon?lat=59.917&lon=10.817&date=${date}&offset=${offset}`);

  return {
    sunrise: sun.properties.sunrise.time,
    sunset: sun.properties.sunset.time,
    moonphase: moon.properties.moonphase
  }
}
