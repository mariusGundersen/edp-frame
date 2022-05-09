setInterval(function () {
  digitalWrite(LED1, 1);
  setTimeout(function () {
    digitalWrite(LED1, 0);
  }, 20);
}, 60000);
setDeepSleep(1);
setSleepIndicator(LED2)