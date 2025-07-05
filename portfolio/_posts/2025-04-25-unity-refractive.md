---
layout: post
title: "Unity URP Refractive Shader"
date: 2025-04-25  09:00:00
thumb: "/assets/portfolio/unity_urp_refractive_shader"
tags:
---

![Hero Image](/assets/portfolio/unity_urp_refractive_shader/screen_0.png)
[Link to Asset Here]()

I created the refractive material shader for Unity Universal Render Pipeline(URP) because the URP does not have a built in shader or material setup for that and because I really like distortion effect shaders.

Years ago I created a similar shader for the Unity Built-In Render Pipeline which was well received at the Unity Asset Store, so it is only fitting to recreate that for the URP pipeline.

## Overview

Different Rendering pipelines in Unity have very different internal structure which means it's not very straightforward to port a shader from one to another. It makes more sense to rebuild it from scratch keeping in mind the given render pipeline architecture and features.

Writing lit shaders for URP pipeline from scratch is not very reasonable because there are a lot of extra passes that make up a standard lit shader. It's better to make use of the Shader Graph system in Unity to author fully featured lit standard shaded shaders.

Some specific functions which don't exist as nodes or are too inconvenient to visually script can still be implemented using custom HLSL code nodes.

## Stable Screen Space Offset

Refractive effects usually use a background texture and sample it with some offset UV coordinates to distort the background texture. A very simple way is to just use a screen space normal coordinate to add an offset into screen space UVs. It creates a distortion effect but it produces a distracting distortion when the camera view is rotated in relation to the object.

My method involves doing all the calculations in world space and converting the result into screen (clip) space last. This ensures that the distortion is created consistently in relation to world space coordinates. The result is very consistent looking refraction effect when moving and panning the camera around in the scene.

## Blurring

To emulate rough glass surfaces the background texture must be selectively blurred.

Textures cannot be simply "Blurred" when sampled in a shader. The texture has to be preblurred or have mipmaps created for it before sampling. The default URP Camera Opaque Texture is not blurred and has no mipmapping support built in.

One way to overcome this limitation is to sample the texture multiple times with different UV coordinates and get the average value in the shader. It works but adds a lot of work to the GPU.

More efficient way is to enable mipmapping for the background texture. This way the texture can be sampled at any specific mipmap level to get a downscaled version of the texture.

I wrote a custom URP Render Feature in order to get access to a background texture which has mipmaps to sample. The feature works well and I managed to even add Instanced XR support into it (only PC VR for now).

## Conclusion

I have always had an affinity to distortion shader effects and I really like how this shader has turned out. Creating the mipmapped opaque texture render feature gave me a lot of new knowledge and experience with developing custom render features in Unity URP render pipeline. I'm sure it will be useful for future projects.