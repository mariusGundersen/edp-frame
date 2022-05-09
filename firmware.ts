
// setup SPI
// connect to wifi
// deep sleep
// fetch data from http endpoint
// send data to
import EDP from './edp';

var spi = SPI1;
spi.setup({
  mosi: B5,
  sck: B3
});

var edp = new EDP({
  busyPin: B4,
  spi,
  csPin: B1,
  dcPin: B2,
  height: 800,
  width: 480,
  resetPin: B6
});

spi.write(1);

LED1.write(true);