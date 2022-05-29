var busy = A5;
var rst = A6;
var dc = A7;
var cs = B1;
var clk = B3;
var din = B5;

var spi = SPI1;

spi.setup({
  sck: clk,
  mosi: din,
  mode: 0,
  baud: 400000,
});

rst.set();
busy.mode("input_pullup");
dc.reset();
cs.set();

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

var edp = {
  sendCommand: sendCommand,
  send: send,
  sendData: sendData,
  setBlack: (data) => send(0x10, data),
  setRed: (data) => send(0x13, data),
  refresh: () => {
    send(0x12);
    return watch(busy);
  },
  off: () => send(0x02),
  deepSleep: () => send(0x07, [0xa5]),
  init: () => {
    digitalPulse(rst, 1, [200, 4]);
    return delay(500).then(() => {
      send(0x01, [0x07, 0x07, 0x3f, 0x3f]);
      send(0x04);
      send(0x00, [0x0f]);
      send(0x61, [0x033, 0x20, 0x01, 0xe0]);
      send(0x50, [0x11, 0x07]);
      send(0x60, [0x22]);
      send(0x65, [0, 0, 0, 0]);
    });
  },
  sleep: () => {
    edp.off();
    setTimeout(() => {
      edp.deepSleep();
    }, 500);
  },
};

exports = edp;
