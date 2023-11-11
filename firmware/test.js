setDeepSleep(true);

function wifi() {
  const gpio0 = A1;
  const gpio2 = A0;
  const rst = A10;
  const urxd = A2;
  const utxd = A3
  const ch_pd = B9;// active high

  ch_pd.reset();
  urxd.mode("input");
  utxd.mode("input");
  gpio2.mode("input");
  gpio0.mode("input");
  rst.set();
}

function edp() {
  const busy = A5;
  const rst = A6;
  const dc = A7;
  const cs = B1;
  const clk = B3;
  const din = B5;

  busy.mode("input");
  rst.mode("input");
  dc.mode("input");
  cs.mode("input");
  clk.mode("input");
  din.mode("input");
}

wifi();
edp();