---
layout: post
title:  "Apple Tree Asset"
date:   2022-08-01 13:59:14 +0200
thumb: "/assets/portfolio/blossom/thumb.png"
tags: 
---

![Tree asset image](/assets/portfolio/blossom/Screenshot_20250203_133105.png)

A project utilizing Unreal Engine Virtual Production VFX workflow needed a blossoming apple tree asset which had to be both detailed and optimised enough to use as the realtime rendered background on the LED wall.

## Geometry

It was quite challenging at first to come up with a Blender Geometry Node system which would have enough detail as well as control to get to the result which was needed.

![Tree Geo Nodes](/assets/portfolio/blossom/Screenshot_20250203_133040.png)

In the end I settled on a classic algorithm for tree modeling: Creating and scattering the branches one level at a time. This approach was a good middleground between complexity and controllability.

## Vertex Data

![Tree Gradient 0](/assets/portfolio/blossom/Screenshot_20250203_132728.png)
![Tree Gradient 1](/assets/portfolio/blossom/Screenshot_20250203_132750.png)

In order to efficiently animate the tree in Unreal Engine I also needed to create a few "gradients" across the tree structure. This allowed me to isolate and add motion to different parts of the tree in the unreal engine shaders.

## Optimisation

![Tree Lod 0](/assets/portfolio/blossom/Screenshot_20250203_132123.png)
![Tree Lod 1](/assets/portfolio/blossom/Screenshot_20250203_132304.png)

The tree had 2 LOD levels. The main difference was in the leaf nodes:
- LOD0: 3D small branches, leaves and blossoms
- LOD1: texture planes in place of the above

The trunk and larger branches did not contribute enough geometry to warrant optimisation in our project context.

## Virtual Production

<video controls>
    <source src="/assets/portfolio/blossom/biwaPreview.mp4"></source>
</video>

I assembled the scene in Unreal Engine and setup the systems for virtual production workflow to display the scene on the LED wall with our camera tracking solution.