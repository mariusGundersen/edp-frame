"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this._resetPin.write(true);
                        return [4 /*yield*/, delay(200)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
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
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.send(0x01, [
                            7,
                            7,
                            0x00111111,
                            0x00111111, // VDL=-15V
                        ]);
                        this.send(0x04); // power on
                        return [4 /*yield*/, delay(100)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.busy()];
                    case 2:
                        _a.sent();
                        this.send(0x00, [
                            0x0f // LUT from OTP, KWR(Black White Red), Scan Up, Shift Right, Booster ON, don't soft-reset
                        ]);
                        this.send(0x61, [
                            this._width >> 8,
                            this._width & 248,
                            this._height >> 8,
                            this._height & 255
                        ]);
                        this.send(0x15, [0]); // disable dual SPI mode
                        this.send(0x50, [
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
                        return [2 /*return*/];
                }
            });
        });
    };
    EDP.prototype.upload = function (bw, red) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.send(0x10, bw);
                        if (red)
                            this.send(0x13, red);
                        this.send(0x12);
                        return [4 /*yield*/, delay(100)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.busy()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    EDP.prototype.sleep = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.send(0x02); // power off
                        return [4 /*yield*/, this.busy()];
                    case 1:
                        _a.sent();
                        this.send(0x07, [0xa5]); // deep sleep
                        this._resetPin.write(false);
                        this._dcPin.write(false);
                        return [2 /*return*/];
                }
            });
        });
    };
    EDP.prototype.busy = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.send(0x71);
                        return [4 /*yield*/, watch(this._busyPin, 'rising')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return EDP;
}());
exports.default = EDP;
function watch(pin, edge) {
    return new Promise(function (res) { return setWatch(res, pin, { repeat: false, edge: edge }); });
}
function delay(ms) {
    return new Promise(function (res) { return setTimeout(res, ms); });
}
