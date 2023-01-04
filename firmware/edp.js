const busy = A5;
const rst = A6;
const dc = A7;
const cs = B1;
const clk = B3;
const din = B5;

const spi = SPI1;

spi.setup({
  sck: clk,
  mosi: din,
  mode: 0,
  baud: 400000,
});

rst.set();
busy.mode("input_pullup");
dc.reset();
cs.reset();

function watch(pin) {
  return new Promise((res, rej) => {
    if (pin.read()) return res();
    setWatch(res, pin, { repeat: false, edge: "rising" });
    setTimeout(rej, 60_000, `timeout: watched pin ${pin} never changed`)
  });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function send(command, data) {
  sendCommand(command);
  if (data && data.length) sendData(data);
}

function sendCommand(command) {
  dc.write(0);
  cs.write(0);
  spi.write(command);
  cs.write(1);
}

function sendData(data) {
  dc.write(1);
  cs.write(0);
  spi.write(data);
  cs.write(1);
}

function async() {
  let p = Promise.resolve();
  for (let i = 0; i < arguments.length; i++) {
    p = p.then(arguments[i]);
  }
  return p;
}

function asyncify() {
  const args = arguments;
  return () => async.apply(null, args);
}

var edp = {
  sendCommand: sendCommand,
  send: send,
  sendData: sendData,
  setBlack: (data) => send(0x10, data),
  setRed: (data) => send(0x13, data),
  refresh: asyncify(
    () => send(0x12),
    () => delay(100),
    () => watch(busy)
  ),
  off: () => send(0x02),
  deepSleep: () => send(0x07, [0xa5]),
  init: asyncify(
    //() => rst.set(),
    //() => dc.reset(),
    () => cs.reset(),
    //() => busy.mode("input_pullup"),
    () => delay(200),
    () => digitalPulse(rst, 0, 4),
    () => delay(200),
    () => {
      send(0x01, [0x07, 0x07, 0x3f, 0x3f]);
      send(0x04);
    },
    () => delay(100),
    () => watch(busy),
    () => {
      send(0x00, [0x0f]);
      send(0x61, [0x033, 0x20, 0x01, 0xe0]);
      send(0x50, [0x11, 0x07]);
      send(0x60, [0x22]);
      send(0x65, [0, 0, 0, 0]);
    }
  ),
  sleep: asyncify(
    () => edp.off(),
    () => watch(busy),
    () => edp.deepSleep(),
    //() => cs.mode("input"),
    //() => dc.mode("input"),
    //() => busy.mode("input")
  ),
};

exports = edp;
