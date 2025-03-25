---
layout: post
title:  "Common Electric Stove"
date:   2025-02-25 10:20:00 +0200
thumb: "/assets/portfolio/electric_stove/thumb.png"
tags: 
---

![Electric Stove Model](/assets/portfolio/electric_stove/screen5.png)

I am getting back into creating assets for various marketplaces so I challenged myself with creating a low poly but high detail model of a common modern electric stove.

The asset is suitable for use in games: [Fab](https://www.fab.com/listings/7cd49320-9e3f-40bd-a05a-9c92859c3edb) [CGTrader](https://www.cgtrader.com/3d-models/household/kitchenware/common-electric-stove)

## Geometry

![Electric Stove Model Wire](/assets/portfolio/electric_stove/screen6.png)
![Electric Stove Model Wire Back](/assets/portfolio//electric_stove/screen7.png)

It was a joy to model something like this. I had full control over the mesh at the vertex level and made use of setting custom normal attributes on certain faces to get the smooth shaded normals pointing in the right direction.

## Textures

![Electric Stove Model Textures](/assets/portfolio/electric_stove/tex.png)

As usual I created high quality complex shaders for the surfaces which I could bake into simple PBR maps later.
This way I have the flexibility of using all the shading nodes available in Blender and having compatible simple PBR shaded material at the end.

## Optimisations

![Electric Stove Model in Unity](/assets/portfolio/electric_stove/unity/Screenshot_20250304_103741.png)

Game engines can render opaque shaders more efficiently than transparent shaders. I split the model materials into 2. Most faces use the opaque material and some faces use the transparent material. This way it is better to render in realtime context.