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
  mode: 0
});

rst.set();
busy.mode('input_pullup');
dc.reset();
cs.set();

setWatch((e) => console.log('busy', e.state, ((e.time - e.lastTime)*1000).toFixed(1)), busy, {repeat: true, edge: 'both', debounce: 10});

function send(command, data) {
  sendCommand(command);
  if (data && data.length)
      sendData(data);
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
  reset: () => digitalPulse(rst, 1, [200, 4]),
  power: () => send(0x01, [0x07, 0x07, 0x3f, 0x3f]),
  on: () => send(0x04),
  panelSettings: () => send(0x00, [0x0f]),
  resolution: () => send(0x61, [0x033, 0x20, 0x01, 0xe0]),
  vcom: () => send(0x50, [0x11, 0x07]),
  tcon: () => send(0x60, [0x22]),
  gateSettings: () => send(0x65, [0, 0, 0, 0]),
  setBlack: data => send(0x10, data),
  setRed: data => send(0x13, data),
  refresh: () => send(0x12),
  off: () => send(0x02),
  deepSleep: () => send(0x07, [0xa5]),
  init: () => {
    edp.reset();
    setTimeout(() => {
      edp.power();
      edp.on();
      edp.panelSettings();
      edp.resolution();
      edp.vcom();
      edp.tcon();
      edp.gateSettings();
    }, 500);
  },
  draw: (black, red) => {
    edp.setBlack(black);
    //edp.setRed(red);
    edp.refresh();
  },
  sleep: () => {
    edp.off();
    setTimeout(() => {
      edp.deepSleep();
    }, 500);
  }
};
