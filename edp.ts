interface Config {
  readonly spi: SPI;
  readonly resetPin: Pin;
  readonly dcPin: Pin;
  readonly csPin: Pin;
  readonly busyPin: Pin;
  readonly width: number;
  readonly height: number;
}
export default class EDP {
  _spi: SPI;
  _resetPin: Pin;
  _dcPin: Pin;
  _csPin: Pin;
  _busyPin: Pin;
  _width: number;
  _height: number;
  constructor(config: Config) {
    this._spi = config.spi;
    this._resetPin = config.resetPin;
    this._dcPin = config.dcPin;
    this._csPin = config.csPin;
    this._busyPin = config.busyPin;
    this._width = config.width ?? 800;
    this._height = config.height ?? 480;
  }

  async reset() {
    this._resetPin.write(true);
    await delay(200);
  }

  send(command: number, data?: number[]) {
    this.sendCommand(command);
    if (data?.length)
      this.sendData(data);
  }

  sendCommand(command: number) {
    this._dcPin.write(false);
    this._csPin.write(false);
    this._spi.write(command);
    this._csPin.write(true);
  }

  sendData(data: number[]) {
    this._dcPin.write(true);
    this._csPin.write(false);
    this._spi.write(data);
    this._csPin.write(true);
  }

  async init() {
    this.send(0x01, [ // power settings
      0b00000111, // disable border LDO, internal DC/DC for VDHR, VDH/VDL, VGH/VGL
      0b00000111, // VGH=20V,VGL=-20V
      0x00111111, // VDH=15V
      0x00111111, // VDL=-15V
    ]);

    this.send(0x04); // power on

    await delay(100);
    await this.busy()

    this.send(0x00, [ // panel settings
      0x0f // LUT from OTP, KWR(Black White Red), Scan Up, Shift Right, Booster ON, don't soft-reset
    ]);

    this.send(0x61, [ // resolution settings
      this._width >> 8,
      this._width & 0b11111000,
      this._height >> 8,
      this._height & 0b11111111
    ]);

    this.send(0x15, [0]); // disable dual SPI mode

    this.send(0x50, [ // vcom and data interval settings
      0x11,
      0x07
    ]);

    this.send(0x60, [0x22]); //timing settings

    this.send(0x65, [
      0x00,
      0x00,
      0x00,
      0x00
    ]);
  }

  async upload(bw: number[], red?: number[]) {
    this.send(0x10, bw);

    if (red)
      this.send(0x13, red);

    this.send(0x12);

    await delay(100);
    await this.busy();
  }

  async sleep() {
    this.send(0x02); // power off
    await this.busy();

    this.send(0x07, [0xa5]); // deep sleep
    this._resetPin.write(false);
    this._dcPin.write(false);
  }

  async busy() {
    this.send(0x71);
    await watch(this._busyPin, 'rising');
  }
}

function watch(pin: Pin, edge: 'rising' | 'falling' | 'both') {
  return new Promise(res => setWatch(res, pin, { repeat: false, edge }));
}

function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}