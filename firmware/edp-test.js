const edp = require('./edp.js');

const g = Graphics.createArrayBuffer(400, 8, 1, {msb: true});
g.setRotation(2);
const view = new Int8Array(g.buffer);
const xff = new Int8Array(50);
xff.fill(0);

var logFile = Storage.open("log", "r");
var line = logFile.readLine();
do {
  console.log(line);
  line = logFile.readLine();
} while (line);

edp.init()
.then(() => {
  const logFile = Storage.open("log", "r");
  edp.setBlack();
  xff.fill(0x00);
  for(let y=0; y<480; y++){
    if(y%8 === 0){
      g.clear();
      const line = logFile.readLine();
      if(line) g.drawString(line, 1, 1);
    }
    edp.sendData(view.subarray((y%8)*50, ((y%8)+1)*50));
    edp.sendData(xff);
  }
  edp.setRed();
  xff.fill(0);
  for(let y=0; y<480; y++){
    edp.sendData(xff);
    edp.sendData(xff);
  }
})
.then(() => edp.refresh())
.finally(() => edp.sleep())
//undefined