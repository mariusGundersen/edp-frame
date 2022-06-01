var config = require("./firmware/config.js");

function fetch(url) {
  return new Promise((res, rej) =>
    require("http").get(url, res).on("error", rej)
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

setDeepSleep(false);
setSleepIndicator(LED2);

B9.set();
Serial2.setup(115200, { rx: A3, tx: A2 });
var wifi = require("./firmware/ESP8266WiFi.js").setup(Serial2);

function run() {
  B9.set();
  wifi
    .reset()
    .then(() => {
      digitalPulse(LED1, 1, 500);

      // disable while we wait for wifi to connect
      setDeepSleep(false);
      return wifi.connect(config.ssid, config.password);
    })
    .then(() => {
      digitalPulse(LED1, 1, [500, 250, 500]);

      const edp = require("./firmware/edp.js");
      edp
        .init()
        .then(() => fetch(config.url))
        .then((response) => {
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
        .then(() => edp.refresh())
        .then(() => edp.sleep())
        .then(() => B9.reset())
        .then(() => setDeepSleep(true))
        .catch((err) => {
          digitalPulse(LED1, 1, [100, 100, 100, 100, 100]);
          require("Storage").write("log", err);
        })
        .then(() => delay(config.delay))
        .then(run);
    });
}

run();
