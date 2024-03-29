
Promise.prototype.finally = function (f) {
  return this.then(
    (x) => Promise.resolve(f()).then(() => x),
    (x) => Promise.resolve(f()).then(() => Promise.reject(x))
  );
};

Promise.any = function(a){
  return new Promise((res, rej) => {
    a.forEach(p => p.then(res, rej));
  });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}


function retry(attempts, task) {
  return () => {
    if (attempts == 0) return task();
    return task().catch(retry(attempts - 1, task));
  }
}

module.exports = {
  retry,
  delay
}