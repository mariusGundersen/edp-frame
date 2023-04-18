const edp = require("./firmware/edp.js");


setInterval(function () {
  console.log(new Date(), 'start');
  edp.init()
    .then(() => console.log(new Date(), 'refresh...'))
    .then(() => edp.refresh())
    .then(() => console.log(new Date(), '...refresh'))
    .then(() => edp.sleep())
    .then(() => console.log('sleeping...'))
    .catch(e => console.log('error', e));
}, 60_000);