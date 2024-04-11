import { fetchJson } from "./fetchJson.js";
import getTiles from "./tiles.js";

const map = {
  'clearsky_day': '01d',
  'clearsky_night': '01n',
  'clearsky_polartwilight': '01m',
  'cloudy': '04',
  'fair_day': '02d',
  'fair_night': '02n',
  'fair_polartwilight': '02m',
  'fog': '15',
  'heavyrain': '10',
  'heavyrainandthunder': '11',
  'heavyrainshowers_day': '41d',
  'heavyrainshowers_night': '41n',
  'heavyrainshowers_polartwilight': '41m',
  'heavyrainshowersandthunder_day': '25d',
  'heavyrainshowersandthunder_night': '25n',
  'heavyrainshowersandthunder_polartwilight': '25m',
  'heavysleet': '48',
  'heavysleetandthunder': '32',
  'heavysleetshowers_day': '43d',
  'heavysleetshowers_night': '43n',
  'heavysleetshowers_polartwilight': '43m',
  'heavysleetshowersandthunder_day': '27d',
  'heavysleetshowersandthunder_night': '27n',
  'heavysleetshowersandthunder_polartwilight': '27m',
  'heavysnow': '50',
  'heavysnowandthunder': '34',
  'heavysnowshowers_day': '45d',
  'heavysnowshowers_night': '45n',
  'heavysnowshowers_polartwilight': '45m',
  'heavysnowshowersandthunder_day': '29d',
  'heavysnowshowersandthunder_night': '29n',
  'heavysnowshowersandthunder_polartwilight': '29m',
  'lightrain': '46',
  'lightrainandthunder': '30',
  'lightrainshowers_day': '40d',
  'lightrainshowers_night': '40n',
  'lightrainshowers_polartwilight': '40m',
  'lightrainshowersandthunder_day': '24d',
  'lightrainshowersandthunder_night': '24n',
  'lightrainshowersandthunder_polartwilight': '24m',
  'lightsleet': '47',
  'lightsleetandthunder': '31',
  'lightsleetshowers_day': '42d',
  'lightsleetshowers_night': '42n',
  'lightsleetshowers_polartwilight': '42m',
  'lightsnow': '49',
  'lightsnowandthunder': '33',
  'lightsnowshowers_day': '44d',
  'lightsnowshowers_night': '44n',
  'lightsnowshowers_polartwilight': '44m',
  'lightssleetshowersandthunder_day': '26d',
  'lightssleetshowersandthunder_night': '26n',
  'lightssleetshowersandthunder_polartwilight': '26m',
  'lightssnowshowersandthunder_day': '28d',
  'lightssnowshowersandthunder_night': '28n',
  'lightssnowshowersandthunder_polartwilight': '28m',
  'partlycloudy_day': '03d',
  'partlycloudy_night': '03n',
  'partlycloudy_polartwilight': '03m',
  'rain': '09',
  'rainandthunder': '22',
  'rainshowers_day': '05d',
  'rainshowers_night': '05n',
  'rainshowers_polartwilight': '05m',
  'rainshowersandthunder_day': '06d',
  'rainshowersandthunder_night': '06n',
  'rainshowersandthunder_polartwilight': '06m',
  'sleet': '12',
  'sleetandthunder': '23',
  'sleetshowers_day': '07d',
  'sleetshowers_night': '07n',
  'sleetshowers_polartwilight': '07m',
  'sleetshowersandthunder_day': '20d',
  'sleetshowersandthunder_night': '20n',
  'sleetshowersandthunder_polartwilight': '20m',
  'snow': '13',
  'snowandthunder': '14',
  'snowshowers_day': '08d',
  'snowshowers_night': '08n',
  'snowshowers_polartwilight': '08m',
  'snowshowersandthunder_day': '21d',
  'snowshowersandthunder_night': '21n',
  'snowshowersandthunder_polartwilight': '21m',
}

const iconsb = {
  '01d': "\ue900",
  '01m': "\ue901",
  '01n': "\ue902",
  '02d': "\ue903",
  '02m': "\ue904",
  '02n': "\ue905",
  '03d': "\ue906",
  '03m': "\ue907",
  '03n': "\ue908",
  '04': "\ue909",
  '05d': "\ue90a",
  '05m': "\ue90b",
  '05n': "\ue90c",
  '06d': "\ue90d",
  '06m': "\ue90e",
  '06n': "\ue90f",
  '07d': "\ue910",
  '07m': "\ue911",
  '07n': "\ue912",
  '08d': "\ue913",
  '08m': "\ue914",
  '08n': "\ue915",
  '09': "\ue916",
  '10': "\ue917",
  '11': "\ue918",
  '12': "\ue919",
  '13': "\ue91a",
  '14': "\ue91b",
  '15': "\ue91c",
  '20d': "\ue91d",
  '20m': "\ue91e",
  '20n': "\ue91f",
  '21d': "\ue920",
  '21m': "\ue921",
  '21n': "\ue922",
  '22': "\ue923",
  '23': "\ue924",
  '24d': "\ue925",
  '24m': "\ue926",
  '24n': "\ue927",
  '25d': "\ue928",
  '25m': "\ue929",
  '25n': "\ue92a",
  '26d': "\ue92b",
  '26m': "\ue92c",
  '26n': "\ue92d",
  '27d': "\ue92e",
  '27m': "\ue92f",
  '27n': "\ue930",
  '28d': "\ue931",
  '28m': "\ue932",
  '28n': "\ue933",
  '29d': "\ue934",
  '29m': "\ue935",
  '29n': "\ue936",
  '30': "\ue937",
  '31': "\ue938",
  '32': "\ue939",
  '33': "\ue93a",
  '34': "\ue93b",
  '40d': "\ue93c",
  '40m': "\ue93d",
  '40n': "\ue93e",
  '41d': "\ue93f",
  '41m': "\ue940",
  '41n': "\ue941",
  '42d': "\ue942",
  '42m': "\ue943",
  '42n': "\ue944",
  '43d': "\ue945",
  '43m': "\ue946",
  '43n': "\ue947",
  '44d': "\ue948",
  '44m': "\ue949",
  '44n': "\ue94a",
  '45d': "\ue94b",
  '45m': "\ue94c",
  '45n': "\ue94d",
  '46': "\ue94e",
  '47': "\ue94f",
  '48': "\ue950",
  '49': "\ue951",
  '50': "\ue952",
}

const icons = {
  clearsky_day: '\ue800',
  clearsky_night: '\ue801', /* '' */
  clearsky_polartwilight: '\ue802', /* '' */
  cloudy: '\ue803', /* '' */
  fair_day: '\ue804', /* '' */
  fair_night: '\ue805', /* '' */
  fair_polartwilight: '\ue806', /* '' */
  fog: '\ue807', /* '' */
  heavyrain: '\ue808', /* '' */
  heavyrainandthunder: '\ue809', /* '' */
  heavyrainshowers_day: '\ue80a', /* '' */
  heavyrainshowers_night: '\ue80b', /* '' */
  heavyrainshowers_polartwilight: '\ue80c', /* '' */
  heavyrainshowersandthunder_day: '\ue80d', /* '' */
  heavyrainshowersandthunder_night: '\ue80e', /* '' */
  heavyrainshowersandthunder_polartwilight: '\ue80f', /* '' */
  heavysleet: '\ue810', /* '' */
  heavysleetandthunder: '\ue811', /* '' */
  heavysleetshowers_day: '\ue812', /* '' */
  heavysleetshowers_night: '\ue813', /* '' */
  heavysleetshowers_polartwilight: '\ue814', /* '' */
  heavysleetshowersandthunder_day: '\ue815', /* '' */
  heavysleetshowersandthunder_night: '\ue816', /* '' */
  heavysleetshowersandthunder_polartwilight: '\ue817', /* '' */
  heavysnow: '\ue818', /* '' */
  heavysnowandthunder: '\ue819', /* '' */
  heavysnowshowers_day: '\ue81a', /* '' */
  heavysnowshowers_night: '\ue81b', /* '' */
  heavysnowshowers_polartwilight: '\ue81c', /* '' */
  heavysnowshowersandthunder_day: '\ue81d', /* '' */
  heavysnowshowersandthunder_night: '\ue81e', /* '' */
  heavysnowshowersandthunder_polartwilight: '\ue81f', /* '' */
  lightrain: '\ue820', /* '' */
  lightrainandthunder: '\ue821', /* '' */
  lightrainshowers_day: '\ue822', /* '' */
  lightrainshowers_night: '\ue823', /* '' */
  lightrainshowers_polartwilight: '\ue824', /* '' */
  lightrainshowersandthunder_day: '\ue825', /* '' */
  lightrainshowersandthunder_night: '\ue826', /* '' */
  lightrainshowersandthunder_polartwilight: '\ue827', /* '' */
  lightsleet: '\ue828', /* '' */
  lightsleetandthunder: '\ue829', /* '' */
  lightsleetshowers_day: '\ue82a', /* '' */
  lightsleetshowers_night: '\ue82b', /* '' */
  lightsleetshowers_polartwilight: '\ue82c', /* '' */
  lightsnow: '\ue82d', /* '' */
  lightsnowandthunder: '\ue82e', /* '' */
  lightsnowshowers_day: '\ue82f', /* '' */
  lightsnowshowers_night: '\ue830', /* '' */
  lightsnowshowers_polartwilight: '\ue831', /* '' */
  lightssleetshowersandthunder_day: '\ue832', /* '' */
  lightssleetshowersandthunder_night: '\ue833', /* '' */
  lightssleetshowersandthunder_polartwilight: '\ue834', /* '' */
  lightssnowshowersandthunder_day: '\ue835', /* '' */
  lightssnowshowersandthunder_night: '\ue836', /* '' */
  lightssnowshowersandthunder_polartwilight: '\ue837', /* '' */
  partlycloudy_day: '\ue838', /* '' */
  partlycloudy_night: '\ue839', /* '' */
  partlycloudy_polartwilight: '\ue83a', /* '' */
  rain: '\ue83b', /* '' */
  rainandthunder: '\ue83c', /* '' */
  rainshowers_day: '\ue83d', /* '' */
  rainshowers_night: '\ue83e', /* '' */
  rainshowers_polartwilight: '\ue83f', /* '' */
  rainshowersandthunder_day: '\ue840', /* '' */
  rainshowersandthunder_night: '\ue841', /* '' */
  rainshowersandthunder_polartwilight: '\ue842', /* '' */
  sleet: '\ue843', /* '' */
  sleetandthunder: '\ue844', /* '' */
  sleetshowers_day: '\ue845', /* '' */
  sleetshowers_night: '\ue846', /* '' */
  sleetshowers_polartwilight: '\ue847', /* '' */
  sleetshowersandthunder_day: '\ue848', /* '' */
  sleetshowersandthunder_night: '\ue849', /* '' */
  sleetshowersandthunder_polartwilight: '\ue84a', /* '' */
  snow: '\ue84b', /* '' */
  snowandthunder: '\ue84c', /* '' */
  snowshowers_day: '\ue84d', /* '' */
  snowshowers_night: '\ue84e', /* '' */
  snowshowers_polartwilight: '\ue84f', /* '' */
  snowshowersandthunder_day: '\ue850', /* '' */
  snowshowersandthunder_night: '\ue851', /* '' */
  snowshowersandthunder_polartwilight: '\ue852', /* '' */
}

/**
 *
 * @param {string} from
 * @param {string} to
 * @returns {Promise<{icon: string, tile: [number, number], temperature: number, time: string, rain: number, symbol: string}[]>}
 */
export default async function getWeather(from, to) {
  const json = await fetchJson(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=59.917&lon=10.817`);

  const mapper = getTiles();

  return json.properties.timeseries
    //.filter(t => new Date(t.time).getHours() % 6 == 0)
    .filter(t => Date.parse(t.time) >= Date.parse(from) && Date.parse(t.time) < Date.parse(to))
    //.filter(t => t.data.next_1_hours?.summary.symbol_code)
    .map(t => ({
      symbol_code: t.data,
      symbol: map[(t.data.next_12_hours ?? t.data.next_6_hours ?? t.data.next_1_hours)?.summary.symbol_code],
      icon: iconsb[map[(t.data.next_12_hours ?? t.data.next_6_hours ?? t.data.next_1_hours)?.summary.symbol_code]],
      tile: getTile(t.data),
      temperature: t.data.instant.details.air_temperature,
      rain:  t.data.next_1_hours?.details.precipitation_amount ?? 0,
      time: t.time
    }))
    .map((t, i, a) => ({
      ...t,
      //tile: tiles[getTiledTile(t.tile, a[i - 1]?.tile ?? 'clear', a[i + 1]?.tile ?? 'clear')]
      tile: mapper(t.tile)
    }));
}

const tiles = {
  "clear": [0, 0],
  "clear start": [1, 0],
  "clear end": [2, 0],
  "fair start": [3, 0],
  "fair end": [4, 0],
  "fair both": [5, 0],
  "cloudy": [0, 1],
  "heavy rain": [1, 1],
  "light rain": [2, 1],
  "thunder": [3, 1],
  "fair": [4, 1],
  "clear both": [4, 1],
}

function getTiledTile(tile, pre, next) {
  if (/clear|fair/.test(tile)) {
    const before = !/clear|fair/.test(pre);
    const after = !/clear|fair/.test(next);
    if (before && after) {
      return tile + ' both';
    } else if (before) {
      return tile + ' start';
    } else if (after) {
      return tile + ' end';
    }
  }
  return tile;
}

function getTile(data) {
  const cloudy = data.instant.details.cloud_area_fraction;
  const rain = data.next_1_hours?.details.probability_of_precipitation;
  const thunder = data.next_1_hours?.details.probability_of_thunder;

  if (thunder > 20) {
    return 'thunder';
  } else if (rain > 50) {
    return 'heavy rain';
  } else if (rain > 10) {
    return 'light rain';
  } else if (cloudy > 50) {
    return 'cloudy';
  } else if (cloudy > 10) {
    return 'fair';
  } else {
    return 'clear';
  }
}
