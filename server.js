let express = require("express");

var app = express();

app.use(express.static("."));

app.get("/data", (req, res) => {
  var fs = require("fs"),
    PNG = require("pngjs").PNG;

  fs.createReadStream("in.png")
    .pipe(new PNG())
    .on("parsed", function () {
      let buffer = new Uint8Array(((800 * 480) / 8) * 2);

      for (var i = 0; i < this.data.length / 4; i++) {
        if (this.data[i * 4] == 0xff && this.data[i * 4 + 1] == 0x00) {
          buffer[48000 + Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        } else if (this.data[i * 4] == 0xff && this.data[i * 4 + 1] == 0xff) {
          buffer[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
        }
      }

      res.end(Buffer.from(buffer), "binary");
    });
});

app.get("/data2", (req, res) => {
  console.log("get data");
  let buffer = new Uint8Array(((800 * 480) / 8) * 2);

  for (let y = 120; y < 360; y++) {
    for (let x = 25; x < 75; x++) {
      buffer[y * 100 + x] = 0xff;
    }
  }

  for (let y = 480 + 180; y < 480 + 300; y++) {
    for (let x = 40; x < 60; x++) {
      buffer[y * 100 + x] = 0xff;
    }
  }

  res.end(Buffer.from(buffer), "binary");
});

app.use((req, res) => {
  console.log(req);
  res.end();
});

app.listen(8080, () => console.log("listening"));
