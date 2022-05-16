let express = require("express");

var app = express();

app.use(express.static("."));

app.get("/data", (req, res) => {
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
