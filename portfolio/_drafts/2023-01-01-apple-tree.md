---
layout: post
title:  "Apple Tree Asset"
date:   2023-01-01 13:59:14 +0200
thumb: "/assets/portfolio/blossom/thumb.png"
tags: 
---

IMAGE HERE

A project utilizing Unreal Engine Virtual Production VFX workflow needed a blossoming apple tree asset which had to be both detailed and optimised enough to use as the realtime rendered background on the LED wall.

## Geometry

It was quite challenging at first to come up with a Blender Geometry Node system which would have enough detail as well as control to get to the result which was needed.

IMAGE HERE

In the end I settled on a classic algorithm for tree modeling: Creating and scattering the branches one level at a time. This approach was a good middleground between complexity and controllability.

## Vertex Data

IMAGE HERE

In order to efficiently animate the tree in Unreal Engine I also needed to create a few "gradients" across the tree structure. This allowed me to isolate and add motion to different parts of the tree in the unreal engine shaders.

## Optimisation

IMAGE HERE

The tree had 2 LOD levels. The main difference was in the leaf nodes:
- LOD0: 3D small branches, leaves and blossoms
- LOD1: texture planes in place of the above

The trunk and larger branches did not contribute enough geometry to warrant optimisation in our project context.

## Virtual Production

IMAGE_HERE

I assembled the scene in Unreal Engine and setup the systems for virtual production workflow to display the scene on the LED wall with our camera tracking solution.

