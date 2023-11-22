
A10.set(); //make sure to set esp-01 RST high;
B9.set(); // enable on Pico Shim V2
Serial2.setup(115200, { rx: A3, tx: A2 });
var wifi = require("ESP8266WiFi").connect(Serial2, function (err) {
  if (err) throw err;
  console.log("Connecting to WiFi");
  var config = require("./config.js");
  wifi.connect(config.ssid, config.password, function (err) {
    if (err) throw err;
    console.log("Connected");
    // Now you can do something, like an HTTP request
    require("http").get(
      "https://webhook.site/eaacf6be-2abe-4916-b6b0-ad9ac5b71575",
      function (res) {
        console.log("Response: ", res);
        res.on("data", function (d) {
          console.log("--->" + d);
          LED1.set();
        });
        res.on("close", function () {
          B9.reset();
        });
      }
    );
  });
});
