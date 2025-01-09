---
layout: post
title:  "Custom Split Keyboard Build"
date:   2024-03-01 12:00:00 +0200
---

![Custom built split ergo keyboard](/assets/blog/split_keyboard/pic_0.jpg)

## Motivation
This article outlines my experience with building a custom split keyboard for myself.
After learning to touch-type I felt that too many symbols are assigned to right pinky finger which made typing fast quite error prone. There are ways to remap keys via software but it would get inconvenient fast when using multiple computers and operating systems. Split keyboards are very expensive for what they are so I commited to building it myself.

## Plan
I decided to base my keyboard design on the [Piantor](https://github.com/beekeeb/piantor).
The 36-key layout seemed perfect for me. I planned to hand solder it and 3D print the case parts so I needed to order the following components:

- switches & keycaps
- two micro controllers (RP2040)
- 2x 3.5mm TRRS socket
- 3.5mm TRRS cable
- a lot of diodes

The cost of these components was somewhere around 70€ which is a significant amount but relative to ready made keyboards like this (400€) its really cheap.

## Build
I modified the model files of the case a bit to make it more interesting and sturdy.
The holes for switches in the switchplate part needed a few iterations to get the dimensions just right.

![3D printed keyboard switchboard](/assets/blog/split_keyboard/pic_1.jpg)
*3D printed switchboard of v1*

## Soldering
From my research I got the impression that hand soldering keyboards is very challenging endevour but in my experience it was not that bad.

![Lots of wires soldered into a matrix and micro controller](/assets/blog/split_keyboard/pic_2.jpg)
*Completed wiring of v2*

But I get why people feel that way, the large amount of solder joints do take a lot of time and patience to complete. I highly recommend [Joe Scotto's Youtube channel](https://www.youtube.com/@joe_scotto) to get a feel for handwiring a keyboard if doing it for the first time. It helped me a lot.

## Firmware
I went with [KMK](https://kmkfw.io) as it seemed like the easiest way. The whole firwmare is just a python script that lives in the micro controllers. Here is my current firmware script.

[code.py](/assets/blog/split_keyboard/code.py)

## First Build is Done!
It was quite crude with the ports and microcontrollers just dangling around not fixed to the case, but it was functional enough to test it out.

![Crude looking v1 split keyboard](/assets/blog/split_keyboard/pic_3.jpg)
*Crude but functional v1*

First month or so using this thing went great, nothing broke and I steadily iterated on my firmware script to make the layout and behaviour just right for me.

## Rebuild Plan
After a few months I commited to rebuilding the keyboard to make it look more professional and compact.
This mainly involved designing new 3D model for the case.
The new case is a single printable piece which makes it easier to build. Also the mounting points for the controllers and ports were more thought through.

## Rebuild Process
It felt so wrong but I disassembled the v1 keyboard because I didn't want to order new parts and I would not have had any use for 2 split keyboards.
Overall the new build went very smooth and much faster because of past experience.

![Completed v2 split keyboard](/assets/blog/split_keyboard/pic_4.jpg)
*Completed v2 split keyboard*

## Conclusion
I am currently writing this article on this exact keyboard and after about 3 months of using it daily I am very pleased with it. It feels awesome to type on and I am much more proficient using this instead of typing on a standard keyboard.
I consider myself a novice when it comes to building electronic devices but I'm glad I tackled this. It was very rewarding experience that taught a lot and was not really overly complex.

So if you are a kind of person that is on the fence about buying or building a split keyboard, just do it! You'll probably love it.