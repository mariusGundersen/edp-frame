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
busy.mode("input");
dc.reset();
cs.reset();

function watch(pin) {
  return new Promise((res) =>
    setWatch(res, pin, { repeat: false, edge: "both" })
  );
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function send(command, data) {
  sendCommand(command);
  if (data && data.length) sendData(data);
}

function sendCommand(command) {
  dc.write(false);
  cs.write(false);
  spi.write(command);
  cs.write(true);
}

function sendData(data) {
  dc.write(true);
  cs.write(false);
  spi.write(data);
  cs.write(true);
}

function async() {
  let p = Promise.resolve();
  for (let i = 0; i < arguments.length; i++) {
    p = p.then(arguments[i]);
  }
  return p;
}

var edp = {
  sendCommand: sendCommand,
  send: send,
  sendData: sendData,
  setBlack: (data) => send(0x10, data),
  setRed: (data) => send(0x13, data),
  refresh: () =>
    async(
      () => send(0x12),
      () => watch(busy)
    ),
  off: () => send(0x02),
  deepSleep: () => send(0x07, [0xa5]),
  init: () =>
    async(
      () => rst.set(),
      () => dc.reset(),
      () => cs.set(),
      () => digitalPulse(rst, 1, [200, 4]),
      () => delay(500),
      () => {
        send(0x01, [0x07, 0x07, 0x3f, 0x3f]);
        send(0x04);
        send(0x00, [0x0f]);
        send(0x61, [0x033, 0x20, 0x01, 0xe0]);
        send(0x50, [0x11, 0x07]);
        send(0x60, [0x22]);
        send(0x65, [0, 0, 0, 0]);
      }
    ),
  sleep: () =>
    async(
      () => edp.off(),
      () => delay(500),
      () => edp.deepSleep(),
      () => cs.reset(),
      () => rst.mode("input"),
      () => dc.mode("input")
    ),
};

exports = edp;
