# DevLog

## 2022-04-29

Today I ordered a 7.5 inch e-ink display from waveshare! It is an 800x480 pixel display that has red/white/black pixels.

## 2022-05-08

Two things I worked on today:

* Testing deep sleep on the espruino
* Implemented dithering algorithm for HTML5 canvas

I don't have the wifi board or the waveshare display yet, so there isn't much code that I can write for the firmware. One thing I wanted to test is the deep sleep of the espruino, for saving battery, and having it run from a spare power bank I have. By using a power bank I don't need to solder anything for a battery and I don't need any battery charging circuitry. But I need a dumb power bank, one that doesn't turn off if no or very little current is drawn. Luckily I found one I already had, which is also 5600mAh, which should last for a very long time, given that I don't draw any current when in deep sleep.

Getting deep sleep to work was rather easy, given the espruino documentation:

```js
setInterval(function () {
  digitalWrite(LED1, 1);
  setTimeout(function () {
    digitalWrite(LED1, 0);
  }, 20);
}, 60*1000);
setDeepSleep(1);
setSleepIndicator(LED2)
```

This deep sleeps the device when nothing happens, and it uses LED2 to indicate if it is sleeping or not. I just have to swap out the content of the `setInterval` function to what I want, and the interval delay to run every hour or once a day or something.

I also looked into dithering, since working with only black and white isn't so nice. I found a really nice article about dithering and implemented some js code and got it to work quite well! Most online articles show the code for the simple scenario of a 1-bit black and white dither, but I needed a 1.5 bit black, white and red dither. A bit of googling hinted at making a palette and finding the color in the palette that was closest to the color of the pixel. So I made a palette of three colors, 0x000000, 0xffffff and 0xff0000 and tweaked the code to work with a three channel pixel (rgb). The result turned out quite well for such a simple code. A better solution would have a proper gamma curve, but it doesn't seem necessary for now. I'll have to take a look at that when the screen arrives and I can transmitt some images to it and see what they actually look like in real life.

## 2022-05-10

Turns out there is a different dithering algorithm that can work better with the kind of graphics I want, called ordered dithering. I've looked at Beyer dithering and got an implementation to work quite well. I used the wikipedia article for implementing it, but after a day of work I found out it was plain wrong in many places. A bit of invastigation and reading the talk page gave me the right math and algorithm to use. Using ordered dithering is better for bar graphs and such, as the patterns created are more structured and don't look so strange.

## 2022-05-12

Yesterday the wifi module arrived and today the screen arrived, so tonight I'm going to a makerspace to solder a bit. I regret not ordering a smaller screen as well, to test with, and a second espruino and wifi module, in case I manage to short circuit something. I'll guess I have to be very careful and double check everything before powering it on, for once...

