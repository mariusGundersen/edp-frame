setInterval(function () {
  require("../wifi").run();
}, 60000);
setDeepSleep(true);
setSleepIndicator(LED2);
