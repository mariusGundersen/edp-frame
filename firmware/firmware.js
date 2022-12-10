const config = require("./firmware/config.js");
const Storage = require("Storage");
const edp = require("./firmware/edp.js");

function fetch(url) {
  return new Promise((res, rej) =>
    require("http").get(url, res).on("error", rej)
  );
}

Promise.prototype.finally = function (f) {
  return this.then(
    (x) => Promise.resolve(f()).then(() => x),
    (x) => Promise.resolve(f()).then(() => Promise.reject(x))
  );
};

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

//setSleepIndicator(LED2);
setSleepIndicator(undefined);

function wait() {
  var now = new Date();
  var mins = 59 - now.getMinutes();
  var secs = 59 - now.getSeconds();

  mins += 15; //try to call 15 past every hour

  return delay(secs * 1000 + mins * 60 * 1000);
}

Serial2.setup(115200, { rx: A3, tx: A2 });
const wifi = require("./firmware/ESP8266WiFi.js").setup(Serial2);

function log(message) {
  Storage.open("log", "a").write(`${new Date()}: ${message}\n`);
}

function run() {
  setDeepSleep(false);
  log("run");
  //Serial2.setup(115200, { rx: A3, tx: A2 });
  wifi.enable();
  return delay(500)
    .then(wifi.reset)
    .then(() => delay(500))
    .then(() => wifi.connect(config.ssid, config.password))
    .then(() => log("connected to wifi"))
    .then(edp.init)
    .then(() => fetch(config.url))
    .then((response) => {
      // Don't write any code here! We don't want to miss any of the incoming packets

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

      return new Promise((res, rej) =>
        response.on("close", () => {
          if (response.statusCode != "200") {
            rej("Request failed " + response.statusCode);
          } else {
            setTime(new Date(response.headers.Date).getTime() / 1000);
            res();
          }
        })
      );
    })
    .finally(() => {
      wifi.disable();
      //Serial2.unsetup();
    })
    .then(() => log("refresh"))
    .then(edp.refresh)
    .finally(edp.sleep)
    .finally(() => setDeepSleep(true))
    .catch((err) => {
      digitalPulse(LED1, 1, [100, 100, 100, 100, 100]);
      log(`Error: ${err}`);
    })
    .then(wait)
    .then(run);
}

setDeepSleep(true);
setTimeout(run, 10_000);

function getLog() {
  var logFile = Storage.open("log", "r");
  var line = logFile.readLine();
  do {
    console.log(line);
    line = logFile.readLine();
  } while (line);
  return "---[end]---";
}

function eraseLog() {
  Storage.open("log", "w").erase();
}
