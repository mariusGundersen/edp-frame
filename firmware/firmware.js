var config = require("./firmware/config.js");

B9.set(); // enable on Pico Shim V2
Serial2.setup(115200, { rx: A3, tx: A2 });
var wifi = require("ESP8266WiFi_0v25").connect(Serial2, function (err) {
  if (err) throw err;

  function fetch() {
    B9.set();
    wifi.reset(function (err) {
      if (err) throw err;

      //console.log("wifi on");
      wifi.connect(config.ssid, config.password, function (err) {
        if (err) throw err;

        //console.log("wifi connected");

        var edp = require("./firmware/edp.js");
        edp.init().then(() => {
          //console.log("edp ready");
          var req = require("http").request(
            {
              host: "192.168.1.110",
              port: 8080,
              path: "/data",
              method: "GET",
            },
            function (res) {
              //console.log("data...");
              edp.sendCommand(0x10);
              var count = 0;
              res.on("data", (d) => {
                if (count + d.length < 48000) {
                  edp.sendData(d);
                  count += d.length;
                } else {
                  edp.sendData(d.slice(0, 48000 - count));
                  edp.sendCommand(0x13);
                  edp.sendData(d.slice(48000 - count));
                  count = 0;
                }
              });
              res.on("close", () => {
                edp
                  .refresh()
                  .then(() => B9.reset())
                  //.then(() => console.log("refresh done"))
                  .then(edp.sleep);
              });
            }
          );

          //req.on("error", (e) => console.log(e));
          req.end();
        });
      });
    });
  }

  fetch();

  setInterval(fetch, 60 * 1000);
});
