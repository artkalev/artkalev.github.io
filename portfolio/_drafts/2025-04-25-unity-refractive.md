---
layout: post
title: "Unity URP Refractive Shader"
date: 2025-04-25  09:00:00
thumb: "/assets/portfolio/unity_urp_refractive_shader"
tags:
---

![Hero Image](/assets/portfolio/unity_urp_refractive_shader/screen.png)

I created the refractive material shader for Unity Universal Render Pipeline(URP) because the URP does not have a built in shader or material setup for that and because I really like distortion effect shaders.

Years ago I created a similar shader for the Unity Built-In Render Pipeline which was well received at the Unity Asset Store, so it is only fitting to recreate that for the URP pipeline.

## Details

Different Rendering pipelines have very different internal structure which means it's not very straightforward to port a shader from one to another. It makes more sense to rebuild it from scratch keeping in mind the given render pipeline architecture and features.