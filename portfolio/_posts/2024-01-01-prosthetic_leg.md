---
layout: post
title:  "Prosthetic Leg Asset"
date:   2025-01-01 13:59:14 +0200
thumb: "/assets/portfolio/prosthetic/thumb.png"
tags: 
---

![Prosthetic leg asset image](/assets/portfolio/prosthetic/screen7.png)

I needed to create an asset of a prosthetic leg that would be used in several shots in [Oxen](https://www.imdb.com/title/tt27416866/).

The leg had to look realistic and allow for minor deformative animation in the flexible parts.

## Geometry

![Prosthetic leg image](/assets/portfolio/prosthetic/screen5.png)

I modeled the leg in manually using subdivision surface method to get the right look for the geometry. I usually prefer to model such geometry by directly adding and manipulating faces and vertices by hand as much as feasable. This allows me to create the base geometry really fast and with maximum control over the shape.

![Prosthetic leg image](/assets/portfolio/prosthetic/screen4.png)

For the foot I used sculpt workflow to create the toenail details and added a thin line geometry to simulate the casting defects that usually happen when such objects are produced in the real world.

## Textures

![Prosthetic leg image](/assets/portfolio/prosthetic/screen6.png)

I usually texture my meshes by first building a shader that has the right impression, then I bake the shader into pbr textures. This allows me to use non destructive texturing methods in Blender and use EEVEE renderer to get fast feedback while working. I bake the shader look into PBR textures in the end to make it easier to import the asset into other 3D software.