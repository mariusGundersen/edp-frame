"use strict";
var EDP = /** @class */ (function () {
    function EDP(config) {
        var _a, _b;
        this._spi = config.spi;
        this._resetPin = config.resetPin;
        this._dcPin = config.dcPin;
        this._csPin = config.csPin;
        this._busyPin = config.busyPin;
        this._width = (_a = config.width) !== null && _a !== void 0 ? _a : 800;
        this._height = (_b = config.height) !== null && _b !== void 0 ? _b : 480;
    }
    EDP.prototype.reset = function () {
        this._resetPin.write(true);
        return delay(200);
    };
    EDP.prototype.send = function (command, data) {
        this.sendCommand(command);
        if (data === null || data === void 0 ? void 0 : data.length)
            this.sendData(data);
    };
    EDP.prototype.sendCommand = function (command) {
        this._dcPin.write(false);
        this._csPin.write(false);
        this._spi.write(command);
        this._csPin.write(true);
    };
    EDP.prototype.sendData = function (data) {
        this._dcPin.write(true);
        this._csPin.write(false);
        this._spi.write(data);
        this._csPin.write(true);
    };
    EDP.prototype.init = function () {
        var _this = this;
        this.send(0x01, [
            7,
            7,
            0x00111111,
            0x00111111, // VDL=-15V
        ]);
        console.log('power on');
        this.send(0x04); // power on
        return delay(100)
            .then(function () {
            console.log('delayed');
            _this.busy();
        })
            .then(function () {
            _this.send(0x00, [
                0x0f // LUT from OTP, KWR(Black White Red), Scan Up, Shift Right, Booster ON, don't soft-reset
            ]);
            _this.send(0x61, [
                _this._width >> 8,
                _this._width & 248,
                _this._height >> 8,
                _this._height & 255
            ]);
            _this.send(0x15, [0]); // disable dual SPI mode
            _this.send(0x50, [
                0x11,
                0x07
            ]);
            _this.send(0x60, [0x22]); //timing settings
            _this.send(0x65, [
                0x00,
                0x00,
                0x00,
                0x00
            ]);
        });
    };
    EDP.prototype.upload = function (bw, red) {
        var _this = this;
        console.log('send bw', bw.length);
        this.send(0x10, bw);
        if (red)
            this.send(0x13, red);
        console.log('flash');
        this.send(0x12);
        return delay(100).then(function () { return _this.busy(); });
    };
    EDP.prototype.sleep = function () {
        var _this = this;
        this.send(0x02); // power off
        return this.busy().then(function () {
            _this.send(0x07, [0xa5]); // deep sleep
            _this._resetPin.write(false);
            _this._dcPin.write(false);
        });
    };
    EDP.prototype.busy = function () {
        this.send(0x71);
        return watch(this._busyPin, 'rising');
    };
    return EDP;
}());
function watch(pin, edge) {
    return new Promise(function (res) { return setWatch(res, pin, { repeat: false, edge: edge }); });
}
function delay(ms) {
    return new Promise(function (res) { return setTimeout(res, ms); });
}
exports.EDP = EDP;
