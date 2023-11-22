B9.reset();

const config = require("./config.js");
const Storage = require("Storage");
const edp = require("./edp.js");
const http = require("http");

/*

function fetch(req) {
  const options = url.parse(req);
  options.method = 'POST';
  options.headers = {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
  }
  return new Promise((res, rej) => {
    const req = require("http").request(options, res);
    req.on("error", rej);
    const logFile = Storage.open("log", "r");
    E.pipe(logFile, req, { chunkSize: 256 });
  });
}
*/


function fetch(url) {
  return new Promise((res, rej) =>
    http.get(url, res).on("error", rej)
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

const log = (message) => console.log(message);//Storage.open("log", "a").write(`${new Date()}: ${message}\n`);

function retry(attempts, task) {
  return () => {
    if (attempts == 0) return task();
    return task().catch(retry(attempts - 1, task));
  }
}


const CHUNK_LENGTH = 480;
const lookup = new Uint8Array(256);
const chunk = new Uint8Array(CHUNK_LENGTH);
function streamDecompress(input, size, callback) {
  "jit";

  let l = 0;
  let c = 0;
  let o = 0;
  let repeat = 0;
  let actual = 0;
  let quad = 0;
  for (let i = 0; i < input.length;) {
    if (l < 256) {
      lookup[l++] = input[i++];
    } else if (o + c >= size) {
      return;
    } else if (repeat > 0) {
      chunk[c++] = input[i];
      repeat--;
      if (repeat === 0) i++;
    } else if (actual > 0) {
      chunk[c++] = input[i++];
      actual--;
    } else if (quad > 0) {
      chunk[c++] = lookup[(input[i] - 64) * 4 + 4 - quad];
      quad--;
      if (quad === 0) i++;
    } else if (input[i] < 0) {
      repeat = 1 - input[i++];
    } else if (input[i] >= 64) {
      quad = 4;
    } else {
      actual = 1 + input[i++];
    }

    if (c === CHUNK_LENGTH) {
      callback(chunk);
      c = 0;
      o += CHUNK_LENGTH;
    }
  }

}

const IMAGE_SIZE = 25000;

B9.set();
A10.set(); //make sure to set esp-01 RST high;
Serial2.setup(115200, { rx: A3, tx: A2 });
const wifi = require("./ESP8266WiFi.js").setup(Serial2);

function run() {
  setDeepSleep(false);
  log("run");
  //Storage.erase('image');
  Storage.write('image', "", 0, IMAGE_SIZE);
  wifi.enable();
  return delay(1000)
    .then(wifi.reset)
    .then(() => delay(1000))
    .then(retry(5, () => {
      log("wifi.connect()");
      return wifi.connect(config.ssid, config.password);
    }))
    .then(() => log("connected to wifi"))
    .then(() => {
      log(`fetch("${config.url}")`);

      return new Promise((res, rej) =>
        fetch(config.url).then((response) => {
          // Don't write any code here! We don't want to miss any of the incoming packets
          let count = 0;
          response.on("data", input => {
            Storage.write('image', input, count, IMAGE_SIZE);
            count += input.length;
          });

          response.on("close", () => {
            if (response.statusCode != "200") {
              rej("Request failed " + response.statusCode);
            } else {
              //eraseLog();
              log("response.on(close)");
              setTime(new Date(response.headers.Date).getTime() / 1000);
              res();
            }
          })
        }));
    })
    .finally(() => {
      log("finally: wifi.disable()");
      wifi.disable();
      //Serial2.unsetup();
    })
    .then(retry(5, () => {
      log("edp.init()");
      return edp.init();
    }))
    .then(() => {
      let count = 0;
      edp.sendCommand(0x10);
      const image = new Int8Array(Storage.readArrayBuffer('image'));
      streamDecompress(image, 96000, data => {
        edp.sendData(data);
        count += data.length;
        if (count === 48000) edp.sendCommand(0x13);
      });
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
setTimeout(() => {
  run().catch(err => log(`catch: ${typeof err === 'string' ? err : JSON.stringify(err)}`));
}, 10000);

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
