const config = require("./firmware/config.js");
const Storage = require("Storage");
const edp = require("./firmware/edp.js");

function fetch(url) {
  return new Promise((res, rej) =>
    require("http").get(url, res).on("error", rej)
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

setDeepSleep(false);
//setSleepIndicator(LED2);
setSleepIndicator(undefined);

B9.set();
Serial2.setup(115200, { rx: A3, tx: A2 });
const wifi = require("./firmware/ESP8266WiFi.js").setup(Serial2);

function update() {
  return wifi
    .reset()
    .then(() => wifi.connect(config.ssid, config.password))
    .then(edp.init)
    .then(() => fetch(config.url))
    .then((response) => {
      if (response.statusCode != "200")
        throw new Error("Request failed " + response.statusCode);

      setTime(new Date(response.headers.Date).getTime() / 1000);

      let count = 0;
      edp.sendCommand(0x10);
      response.on("data", (d) => {
        if (count + d.length < 48000) {
          edp.sendData(d);
          count += d.length;
        } else {
          edp.sendData(d.slice(0, 48000 - count));
          edp.sendCommand(0x13);
          edp.sendData(d.slice(48000 - count));
          count = 0;
        }
      });

      return new Promise((res) => response.on("close", res));
    })
    .then(edp.refresh)
    .then(edp.sleep);
}

function wait() {
  var now = new Date();
  var mins = 59 - now.getMinutes();
  var secs = 59 - now.getSeconds();

  mins += 10; //try to call 10 past every hour

  return delay(secs * 1000 + mins * 60 * 1000);
}

function run() {
  setDeepSleep(false);
  B9.set();
  return update()
    .then(() => {
      B9.reset();
      setDeepSleep(true);
    })
    .catch((err) => {
      digitalPulse(LED1, 1, [100, 100, 100, 100, 100]);
      Storage.open("log", "a").write(`${new Date()}: Error: ${err}\n`);
    })
    .then(wait)
    .then(run);
}

run();

function getLog() {
  var logFile = Storage.open("log", "r");
  var line;
  do {
    console.log(line);
    line = logFile.readLine();
  } while (line);
}

function eraseLog() {
  Storage.open("log", "w").erase();
}
