//@ts-check

import { Temporal } from "@js-temporal/polyfill";
import { google } from "googleapis";
import { drawInCanvas } from "./canvas.js";
import { getConfig } from "./getConfig.js";
import getWeather from "./weather.js";

const DAYS = [
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
  'Søndag'
];
const MONTHS = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
]

export default async function drawCalendar() {
  const marginLeft = 62;
  const dayWidth = 246;
  const hourHeight = 20;

  const today = Temporal.Now.plainDate(Temporal.Calendar.from('iso8601'), Temporal.TimeZone.from('CET'));
  const weather = await getWeather(today.toString(), today.add({ days: 3 }).toString()).then(w => w.map((w) => ({
    ...w,
    dateTime: Temporal.Instant.from(w.time).toZonedDateTime({ calendar: 'iso8601', timeZone: 'CET' }).toPlainDateTime()
  })));

  const events = await getCalendarEvents(today.toPlainDateTime().toString() + 'Z', today.add({ days: 3 }).toPlainDateTime().toString() + 'Z');

  console.log(today.toPlainDateTime({ hour: 9 }).toString());
  const happenings = events
    .filter(e => e.start?.dateTime)
    .map(e => ({
      start: Temporal.Instant.from(e.start?.dateTime ?? '').toZonedDateTimeISO(e.start?.timeZone ?? '').toPlainDateTime(),
      end: Temporal.Instant.from(e.end?.dateTime ?? '').toZonedDateTimeISO(e.end?.timeZone ?? '').toPlainDateTime(),
      summary: e.summary ?? ''
    }))
    .sort((a, b) => Temporal.PlainDateTime.compare(a.start, b.start))
    .filter((e, i, l) => i === 0 || !isSameEvent(e, l[i - 1]));
  console.log(happenings);

  return await drawInCanvas(async ctx => {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.font = '28px OpenSans';

    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = "#aaa";
    ctx.font = '15px OpenSans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 7; i < 24; i++) {
      ctx.moveTo(marginLeft, i * hourHeight);
      ctx.lineTo(800, i * hourHeight);
      /*
      ctx.moveTo(marginLeft + 5, i * hourHeight);
      ctx.lineTo(marginLeft + dayWidth - 5, i * hourHeight);
      ctx.moveTo(marginLeft + dayWidth + 5, i * hourHeight);
      ctx.lineTo(marginLeft + dayWidth * 2 - 5, i * hourHeight);
      ctx.moveTo(marginLeft + dayWidth * 2 + 5, i * hourHeight);
      ctx.lineTo(marginLeft + dayWidth * 3 - 5, i * hourHeight);
      */
      ctx.fillText(`${i < 10 ? '0' + i : i}:00`, marginLeft / 2, i * hourHeight);
    }
    ctx.stroke();

    ctx.beginPath();
    for (let d = 0; d < 3; d++) {
      const day = today.add({ days: d });
      const morning = day.toPlainDateTime({ hour: 7 });

      const left = marginLeft + dayWidth * d;
      const center = left + dayWidth / 2;
      const right = left + dayWidth;
      const weekdayName = DAYS[day.dayOfWeek - 1];
      const monthName = MONTHS[day.month - 1];
      const todaysWeather = weather.find(w => w.dateTime.equals(morning)) ?? weather[0];
      const todaysTemperatures = weather.filter(w => w.dateTime.toPlainDate().equals(day)).map(w => w.temperature);
      const minTemperature = Math.min(...todaysTemperatures);
      const maxTemperature = Math.max(...todaysTemperatures);

      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.font = '28px OpenSans';
      ctx.fillText(weekdayName, center, 5 * hourHeight);
      ctx.font = '18px OpenSans';
      ctx.fillText(`${day.day}. ${monthName}`, center, 5 * hourHeight + 24);
      ctx.font = '60px yr';
      ctx.fillText(todaysWeather.icon, center, 40);
      ctx.font = '16px OpenSans';

      ctx.fillStyle = minTemperature < 0 ? '#000' : '#f00';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.round(minTemperature)}°C`, center - 45, 40);

      ctx.fillStyle = maxTemperature < 0 ? '#000' : '#f00';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(maxTemperature)}°C`, center + 45, 40);

      if (isRain(todaysWeather.symbol)) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#f00';
        ctx.fillText(`${Math.round(todaysWeather.rain)}mm`, center, 75);
      }

      for (const { start, end, summary } of happenings.filter(h => h.start.toPlainDate().equals(day))) {
        const yOffset = Math.max(7, start.hour + start.minute / 60);
        const isOneDayEvent = start.toPlainDate().equals(end.toPlainDate());
        console.log(isOneDayEvent, start.toPlainDate().toString(), end.toPlainDate().toString())
        const height = isOneDayEvent ? Math.max(1, end.hour + end.minute / 60 - yOffset) : 25 - yOffset;

        ctx.beginPath();
        ctx.strokeStyle = '#f00';
        ctx.fillStyle = '#faa'
        ctx.roundRect(left + 5, yOffset * hourHeight, dayWidth - 10, height * hourHeight, 5);
        ctx.fill();
        ctx.stroke();
        ctx.textAlign = 'left';
        ctx.font = '15px OpenSans';
        ctx.fillStyle = '#000';
        // measure text
        ctx.fillText(summary, left + 10, yOffset * hourHeight + 10, dayWidth - 10);
      }
    }
  });
}

/**
 * @param {{ start: Temporal.PlainDateTime; end: Temporal.PlainDateTime; summary: string; }} a
 * @param {{ start: Temporal.PlainDateTime; end: Temporal.PlainDateTime; summary: string; }} b
 */
function isSameEvent(a, b) {
  return a.summary === b.summary && a.start.equals(b.start) && a.end.equals(b.end);
}

/**
 * @param {string} timeMin
 * @param {string} timeMax
 */
async function getCalendarEvents(timeMin, timeMax) {
  const config = await getConfig();
  /** @type {any} */
  const auth = google.auth.fromJSON(config.google);
  const calendar = google.calendar({ version: 'v3', auth });
  return await Promise.all([
    getEvents(calendar, 'gundersen@gmail.com', timeMin, timeMax),
    getEvents(calendar, 'annaemelieakesson@gmail.com', timeMin, timeMax),
  ]).then(p => p.flat());
}


/**
 * @param {import("googleapis").calendar_v3.Calendar} calendar
 * @param {string} calendarId
 * @param {any} timeMin
 * @param {any} timeMax
 */
async function getEvents(calendar, calendarId, timeMin, timeMax) {
  const { data } = await calendar.events.list({
    calendarId,
    timeMin,
    timeMax,
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime'
  });

  return data.items?.map(({ start, end, summary }) => ({
    start,
    end,
    summary
  })) ?? [];
}

/**
 * @param {string} icon
 */
function isRain(icon) {
  const value = parseInt(icon, 10);
  console.log(icon, value);
  if (value < 5) return false;
  if (value < 15) return true;
  if (value === 15) return false;
  return true;
}
