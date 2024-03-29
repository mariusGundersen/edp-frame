# DevLog

## 2022-04-29

Today I ordered a 7.5 inch e-ink display from waveshare! It is an 800x480 pixel display that has red/white/black pixels.

## 2022-05-08

Two things I worked on today:

- Testing deep sleep on the espruino
- Implemented dithering algorithm for HTML5 canvas

I don't have the wifi board or the waveshare display yet, so there isn't much code that I can write for the firmware. One thing I wanted to test is the deep sleep of the espruino, for saving battery, and having it run from a spare power bank I have. By using a power bank I don't need to solder anything for a battery and I don't need any battery charging circuitry. But I need a dumb power bank, one that doesn't turn off if no or very little current is drawn. Luckily I found one I already had, which is also 5600mAh, which should last for a very long time, given that I don't draw any current when in deep sleep.

Getting deep sleep to work was rather easy, given the espruino documentation:

```js
setInterval(function () {
  digitalWrite(LED1, 1);
  setTimeout(function () {
    digitalWrite(LED1, 0);
  }, 20);
}, 60 * 1000);
setDeepSleep(1);
setSleepIndicator(LED2);
```

This deep sleeps the device when nothing happens, and it uses LED2 to indicate if it is sleeping or not. I just have to swap out the content of the `setInterval` function to what I want, and the interval delay to run every hour or once a day or something.

I also looked into dithering, since working with only black and white isn't so nice. I found a really nice article about dithering and implemented some js code and got it to work quite well! Most online articles show the code for the simple scenario of a 1-bit black and white dither, but I needed a 1.5 bit black, white and red dither. A bit of googling hinted at making a palette and finding the color in the palette that was closest to the color of the pixel. So I made a palette of three colors, 0x000000, 0xffffff and 0xff0000 and tweaked the code to work with a three channel pixel (rgb). The result turned out quite well for such a simple code. A better solution would have a proper gamma curve, but it doesn't seem necessary for now. I'll have to take a look at that when the screen arrives and I can transmitt some images to it and see what they actually look like in real life.

## 2022-05-10

Turns out there is a different dithering algorithm that can work better with the kind of graphics I want, called ordered dithering. I've looked at Beyer dithering and got an implementation to work quite well. I used the wikipedia article for implementing it, but after a day of work I found out it was plain wrong in many places. A bit of invastigation and reading the talk page gave me the right math and algorithm to use. Using ordered dithering is better for bar graphs and such, as the patterns created are more structured and don't look so strange.

## 2022-05-12

Yesterday the wifi module arrived and today the screen arrived, so tonight I'm going to a makerspace to solder a bit. I regret not ordering a smaller screen as well, to test with, and a second espruino and wifi module, in case I manage to short circuit something. I'll guess I have to be very careful and double check everything before powering it on, for once...

The makerspace had a lot of good equipment, even some smd components that I could use (I could add a capacitor, according to the soldering instructions, for better power management. I planned to skip it and hope for the best, but since I found a large 10uF smd capacitor that I could have I decided to add it anyways). I needed to file down the shim a bit before it would fit, but soldering it in place went quite smooth. After soldering everything in place I tested it on my computer with the wifi/http example code, and it worked! Very cool!

One problem I ran into was trying to connect to an https endpoint. It should work, but I got various errors. I guess I'll have to look into that later. I also tried to correct the display and test with some simple code, but nothing happened so I need some more time to investigate. It was getting late so I packed up my stuff to leave, only to realize that, contrary to my house, the makerspace has oscilloscopes! I could have used an oscilloscope to check the data sent back and forth to the display. At home I had only a multimeter for checking the circuitry, and that wouldn't help much. Oh well, maybe I have to come back here, if I can't get it to work at home.

## 2022-05-15

Time to get the display to work. There isn't much to work on, since there is no output from the display back to the device. Normally I would read some version info or something from the display, to make sure the serial connection is working correctly, but I can't even do that! I have tested a bit before, and when I tried to refresh the display nothing happened, so there is something I'm not doing right. I just hope I haven't broken it with my testing.

There is a busy signal from the display, so I've set up a pin watcher so I can see what value it has and log when it changes. I messed about a bit before getting the watch code to work correctly (turns out by default it unlistens after the first change, and I didn't provide any options). Then when it reported the value correctly I needed to parse the info correctly. The busy pin is active low, so when the espruino reported `busy false`, because the pin was low, it meant that it was busy, since low is active. After turning it around in my head a few times I realized something wasn't right, since the display was reporting that it was always busy, never ready for new data. I toggled the reset pin and saw how busy changed several times between true and false, as the documentation said it would. But it ended up being busy, and sending other commands didn't result in anything. I looked at the python source code to see what was done there, and the only difference between my code and theirs was the duration of the reset toggle. Reset is also active low, so to reset the display the pin has to be set to false, and for it to not be reset it has to be set to true. Confusingly the way to set a pin to false is to call `pin.reset()`. Again I turned things back and forth in my head until I was certain I got the right values in the right order. I then used the `pulse` method of the espruino to set the pin high and low at the correct timings, matching the ones from the python script. Turns out the timing was important! The reset pin needed to be held low for 4ms only, then high again. The actual sequence was 200ms high, 4ms low, 200ms high, but since it started high and was left high, only the 4ms low was important.

With that in place I could send the power settings and power on commands (I now sent exactly the same commands and data in the exact same order as the python script, to get it to work. I could change and simplify things later) and I observed how the busy bin toggled exactly where the python script waited for busy to resolve! Great, now I just needed the other commands, and then to send an image and refresh the screen. The first attempt I made just sent an empty array of 48 000 bytes to the display, and I got a black screen! It's working! The display is 800x480 pixels, and each pixel is 1 bit (for the black and white image), so it expects `480*800/8 = 48000` bytes of data.

I tried to draw some rectangles by writing for loops, but quickly moved on to using the espruino graphics library instead. It supports 1bpp images that use an Uint8Array as backing store, so I could create the graphics, draw to it and then transmit the entire array to the display. It also supports text with a few different fonts, so I could test what text looked like. I was very curious about the text, since I wanted to display text data and had no idea what the text would actually look like. How readable is this epaper actually? Will it look blury, smudgy, grainy or crisp? To my surprise it looks quite pixelated. But at first not in a good way. The characters weren't readable at all, it was like some alien language or hieroglyphics or something. I figured the font was too small for the display, so I tried with the largest font, and that too looked wrong. But being larger it was easier to spot what was wrong: some characters looked backwards! I quickly realized that the display expected the data being most significant bit first, but the graphics library probably set it up with least significant bit first. An option set to `"msb"` fixed that, and suddenly I had some large and some small text on the display!

The smallest font produces 1px wide lines, with no anti-aliasing, and the display rendered it exactly as an lcd screen would. That's very good, it means I can have details down to 1px and still have it be displayed correctly. The large font also looks very nice, with the large areas of black being even and smooth, each pixel has the same darkness. I'm impressed by this display.

I think that's it for tonight, it's getting late.

## 2022-05-16

I now have all the individual pieces working: the screen can be updated and I can make http requests. It's time to put it all together. The plan is to make an http request and recieve the binary data that needs to be written to the display. The display is 800x480 pixels, and each pixel is one bit, so I need 48 000 bytes to update the screen. Each pixel can be black, white or red, and to set it to red I need to transmit another 48 000 bytes where 1 means red and 0 means not-red. So the http request will need to return 96 000 bytes that I will forward to the display.

The example code for http requests shows the `on('data', function(data) => { ... })` event, where the callback is given the data that is received. From the example it's clear that this is just a chunk of data from the network stream, and it needs to be reassembled into a string manually. But I don't want a string, I want binary data. I thought it would use an Uint8Array when the response was binary, and I managed to deal with the data as if it was an array, but after a bit of testing I realize it's just a string that contains binary values. It seems to work ok, but it doesn't feel entirely safe to put `0x00` into a string.

I had a few problems when testing this. The first error I encountered was that I filled up the FIFO queue and the espruino ran out of memory. It has very limited RAM, and can't even fit the 48 000 bytes needed. So I take the data and feed it directly to the display. In other words, I pipe Serial2 to SPI1. Unfortunotely for me SPI1 wasn't fast enough, so Serial2 would fill up its buffer and quite quickly cause a crash. But the problem was easily fixed by setting the baud rate for SPI1 much higher than Serial2.

I tried to only write the black and white image first, but if I didn't set the red pixels I would end up with a garbage red image on top of the black and white image. It looks a bit like old TV static, or like corrupted video. I guess it's because the buffer on the display for the red pixels contains random values, and when I don't overwrite them they are shown on screen. To work around this I first tried to generate an empty array of 48 000 bytes and send that to the display, but that's how I found the RAM limitations of the espruino pico, since it would run out of memory and crash. So I quickly moved on to receiveing the red pixels too, since generating an empty red image on the server was a lot easier.

So the last thing I needed now was to count out 48 000 bytes when receiving data and call the red pixel command before sending the rest of the received data. I hacked together some quick counting code and when testing it worked perfectly, on the first attempt! I was quite surprised.

On the server I first made a script to generate the bits and bytes, and I drew a white box on a black background (since 0 means black, 1 means white, and `new Uint8Array(48000)` generate a bunch of 0's). While working on this I set up the espruino to make the http request and refresh the display every 60 seconds. I then doubled the array size and drew a smaller red rectangle in the middle. But writing code to generate images is a bit tedious, so I next used `pngjs` to parse and process an image loaded from my file system. That way I could more easily create test images to send. The png library exposes an image data array (similar to what the HTML5 canvas has) that has 4 values per pixel, red, green, blue and alpha. I made a for loop to iterate over the image data array and write bits to the 48 000 uint8array. This requires some bit fidling, as the first 8 pixels from the image all fit in the same byte of the Uint8Array. So I used `data[Math.floor(i/8)] |= 1 << (7 - i%8)` to set a bit to 1 if the pixel was black. The first attempt at this just used `1 << (i%8)`, which shifts 1 up depending on the remainder of i/8. This produced some very strange vertical lines on the display. I recognized this pattern from earlier and remembered that the display expects the most significant bit first, but this puts the least significant bit first. So I changed it to `1 << (8 - i%8)`, and this produced an almost correct image, but with some thing vertical lines. Well, seems I need `1 << (7 - i%8)` to get the correct bits. This is the kind of code and mistakes that are easily picked up by unit tests, but testing on a live system is much more fun!

With this in place I got the first test image to work! I saved the canvas from my dithering work as a png and sent it, and it worked perfectly! Next up I found an image of my girlfriend holding our twins, passed it through the dithering code, saved the resulting image and sent it to the display, and it all worked! That's when I decided to end for the evening, so I unplugged the display and since it's an e-paper display the image is still there.

## 2022-05-22

I ordered a frame and measured and cut passepartout for holding the display. They arrived yesterday and now it's time to mount them. I'll cut a hole in the back of the frame for the ribboncable to go through and then affix the pcbs on the backside of the frame. Unfortunately it seems I have been lazy and used the measurements from the datasheet rather than measure the display myself, so the hole in the passepartout is both too large and a bit too narrow. It still works, but a bit of the bottom of the display shows through. I will have to live with this for now, but I plan to measure properly and order another one.

I have mounted the display upside down in the frame, so that the ribbon cable comes out near the hinge of the stand. But this means the image is upside down. So now it's time to updat the server to fix this. I figure it's as easy as sending the image in the reverse pixel order to render it upside down. But I have some problem getting the code to work, as I'm trying something clever with Uint32Array to loop over the image data. I give up, as I'd rather have the code work. But I figure out that Uint32Array puts the bytes in (what I feel is) the reverse order. I guess I'll give it a try again later.

With the image in the right order it's time to figure out the problem with the wifi and deep sleep. The wifi fetching works the first time, but I get a weird error about "already getting data" the second time I run the wifi/http code. I'm guessing something isn't cleaned up so when I run the wifi.connect the second time it's getting confused. I found the place in the source code where the error is from by searching for the error on github. It seems like the serial code is confused because it has already received data when it's told to connect. After a lot of trial and error and looking at very sparse documentation it turns out that calling `wifi.connect()` should only be done once, the second time I should call `wifi.reset()`. It's also safe to call reset right after connect, so that's what I'm going to do. With that in place the fetching code can be run using `setInterval` to fetch a new image a regular intervals. The plan is to run it once an hour, but for testing I'm running it every 2 minutes. Unfortunately it seems like there is still some issue with it when it's running on usb power. I'll have to look into that next time.

## 2022-05-31

A couple of long trial and error sessions trying to get it to work. I've had lots of problems getting the wifi to connect and fetch data. Well, it works the first time, but not the second time. And then when it works it only seems to work when the usb is connected. I've created a simpler scenario to debug the issue, where I flash the LED in different patterns at different stages in the process. After hours of frustration I went to the forums to ask for help, but as I typed out the problem I figured it out. Rubber duck debugging works! The problem was that having the espruino deep sleep enabled caused it to fall asleep while waiting for wifi to connect, and then it never got the response from the wifi module, since it was sleeping. The solution was to disable deepSleep while I was doing whe work. So now I enable deepSleep right before the setTimeout and then disable it again right after. The second issue I figured out in bed later that night: I had forgotten to enable the wifi module again after the deep sleep!

The current code is based on the existing modules and examples, and relies on callbacks. It has too many levels of nested callbacks to be easily understood. I want it to be easier to understand, so I tried to rewrite it using async/await and a while loop with a `await dealy(60*1000)` statement (where the delay function is a simple promisified wrapper around setTimeout), but the espruino doesn't support async/await and the babel converted code doesn't run on the espruino. So I had to write it using `.then()` chains manually. That meant rewriting the wifi module to return promises rather than take callbacks. This makes the code a lot flatter and easier to read and verify that it behaves correctly. I still have some idea for how to improve it, but I'll have to do that some other time.

With the firmware finally working I configured it to fetch data from an azure function rather than my laptop, and then I placed the frame connected to a battery on the shelf. The azure function simply returns the image that I've been testing with, so it's not very useful and I can't even see when it has updated. Instead I have to check the azure function logs and see when it has been called.

Seems like something isn't working. The endpoint is called three times, then it's quiet. So there is still some more debugging to do.

## 2022-06-12

I tried to do something clever, but broke things again. There seems to be nothing I can do between receiving the http response and starting to listen for incoming data. If I put any code between there it will miss out on the first few incoming packets, and the image becomes either slightly or completely messed up. I found out this before, but forgot and made the same mistake again, as I was adding a check for the response statusCode. So now I have moved that code to the end of the response handler. It is the same with setting the current time. The internal clock is not very accurate, since it's not based on a chrystal (I should buy one and solder it on), so it drifts quickly. To compensate for this I use the Date resonse header to set the current time. But since I have to do it in the response end handler I get the wrong value. The Date header is set on the server when the response starts, but is used on the client after the entire response has been received and sent to the screen, which takes many seconds. So the internal time is always 10-15 seconds wrong.

Another thing I fixed was to set it to trigger 10 past every hour, rather than on the hour. Since the clock drifts and is wrong anyways, it ended up making a request at x:59:##, and then again a few minutes later. And at that point the consumption info hadn't been updated yet, so I changed it to update 10 past every hour, so that it only does it once per hour and so that it gets the updated consumption info.

## 2022-06-21

Battery isn't lasting as long as I expect. While thinking about I figured that I should disable the wifi before I start the refresh of the edp, so that the wifi is disabled while the screen updates, which can take 15-30 seconds. That should save some battery. While trying to implement this I realized that if the wifi fetching fails it never disables the wifi, and it doesn't go back to deep sleep. The reason is that I have that code in a `.then()`, but that isn't called, since it's a rejected promise. I should have that code in a `.finally()` so that it's run for all cases. But `.finally()` isn't implemented in espruino, so I need to polyfill it, and send a pull-request to espruino.

While implementing this change I wanted to use some new features that I had made to espruino. Yes, I have some pull-requests that have been accepted and merged into v2.14 of the espruino firmware. But I couldn't get the firwmare to update on my machine. After some googling it turns out it might not work on some windows systems. Luckily it worked on my other laptop, so now I have the latest version.

## 2022-06-22

Still something isn't right, it doesn't always manage to connect. A reboot, by disconnecting and reconnecting the battery, seems to help though. I have a feeling I need to add a small dealy after turning on power to the wifi module and trying to connect, to get it to boot up propperly.

## 2022-08-21

It's been running over summer and works pretty well. I had to replace the single lipo battery with three AA batteries for it to last longer than a few days. Now it lasts at least three weeks, mayb more.

## 2023-11-14

Trying do figure out why it's pulling so much power! I have a new pico and a new ESP8266 that I can test on using a multimeter.

- The pico draws 16uA when in deep sleep (with the program `setDeepSleep(true);`), measured at the battery
- When the esp01 module is connected to 3.3v source (on the pico) it draws 1069uA, measured on the 3.3v pin
  - But if the EN pin (CH_PD) is flipped high and then low again it only draws 25uA!
  - With a simple program I can get it to flip back and forth between a few mA and 25uA.
- But I am not able to measure the battery draw reliably.
