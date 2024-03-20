B9.reset();
A10.reset();

const config = require("./config.js");
const Storage = require("Storage");
const edp = require("./edp.js");
const http = require("http");
const utils = require('./modules/utils.js');
const delay = utils.delay;
const retry = utils.retry;

function fetch(url) {
  return new Promise((res, rej) =>
    http.get(url, res).on("error", rej)
  );
}

//setSleepIndicator(LED2);
setSleepIndicator(undefined);

function wait() {
  var now = new Date();
  var hours = 23 - now.getHours();
  var mins = 59 - now.getMinutes();
  var secs = 59 - now.getSeconds();

  hours += 4; //try to call 04:00

  return delay((secs + (mins + hours * 60) * 60) * 1000);
}

function getBattery(){
  return Math.round(analogRead(A5)*300 - 200);
}

B9.set(); //make sure to set esp-01 EN high;
A10.set(); //make sure to set esp-01 RST high;
Serial2.setup(115200, { rx: A3, tx: A2 });
const wifi = require("./ESP8266WiFi.js").setup(Serial2);

let logMethod = 'storage';
function log(message) {
  if (logMethod === 'console') {
    console.log(message);
  } else if (logMethod === 'storage') {
    Storage.open("log", "a").write(`${new Date()}: ${message}\n`);
  }
}

function run() {
  setDeepSleep(false);
  log("run");
  wifi.enable();
  return delay(1_000)
    .then(wifi.reset)
    .then(() => delay(1_000))
    .then(retry(5, () => {
      log("wifi.connect()");
      return wifi.connect(config.ssid, config.password);
    }))
    .then(() => log("connected to wifi"))
    .then(retry(5, () => {
      log("edp.init()");
      return edp.init();
    }))
    .then(retry(5, () => {
      log(`fetch({})`);
      return fetch(config.options(getBattery()));
    }))
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
            log("response.on(close)");
            setTime(new Date(response.headers.Date).getTime() / 1000);
            res();
          }
        })
      );
    })
    .finally(() => {
      log("finally: wifi.disable()");
      wifi.disable();
    })
    .catch((err) => {
      log(`catch: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
      
      const g = Graphics.createArrayBuffer(400, 8, 1, {msb: true});
      g.setRotation(2);
      const view = new Int8Array(g.buffer);
      const bg = new Int8Array(50);
      bg.fill(0);

      const logFile = Storage.open("log", "r");
      edp.setBlack();
      for(let y=0; y<480; y++){
        if(y%8 === 0){
          g.clear();
          const line = logFile.readLine();
          if(line) g.drawString(line, 1, 1);
        }
        edp.sendData(view.subarray((y%8)*50, ((y%8)+1)*50));
        edp.sendData(bg);
      }
      edp.setRed();
      for(let y=0; y<480; y++){
        edp.sendData(bg);
        edp.sendData(bg);
      }
      eraseLog();
    })
    .then(() => {
      log("then: edp.refresh()");
      return edp.refresh();
    })
    .finally(() => {
      log("finally: edp.sleep()");
      return edp.sleep();
    })
    .finally(() => {
      log("finally: setDeepSleep(true)");
      setDeepSleep(true);
    })
    .catch((err) => {
      log(`catch: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
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
