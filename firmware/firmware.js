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
    (x) =>
      Promise.resolve(f()).then(() => {
        throw x;
      })
  );
};

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

setDeepSleep(false);
//setSleepIndicator(LED2);
setSleepIndicator(undefined);

Serial2.setup(115200, { rx: A3, tx: A2 });
const wifi = require("./firmware/ESP8266WiFi.js").setup(Serial2);

function wait() {
  var now = new Date();
  var mins = 59 - now.getMinutes();
  var secs = 59 - now.getSeconds();

  mins += 10; //try to call 10 past every hour

  return delay(secs * 1000 + mins * 60 * 1000);
}



function run() {
  setDeepSleep(false);
  wifi.enable();
  return wifi
    .reset()
    .then(() => wifi.connect(config.ssid, config.password))
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
    .finally(wifi.disable)
    .then(edp.refresh)
    .then(edp.sleep)
    .finally(() => setDeepSleep(true))
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
