---
title: "WebGL2 Basics: Texture"
---

This is a tutorial article on the basics of using textures while drawing with WebGL2. It builds upon the [last tutorial]({% post_url 2025-01-09-webgl-basics %}) where we were drawing a triangle with vertex colors.

## UV Coordinates

Before we get to creating and loading textures, we must be aquinted with texture coordinates (UVs).

Texture coordinates are needed to define how the 2D texture image is mapped on the triangles of the geometry in the 3D space. The uv coordinate space is normalized so that the whole image is contained between:
- <code>vec2(0.0, 0.0)</code>
- <code>vec2(1.0, 1.0)</code>

EXAMPLE_HERE

## Shader Program Changes

Strictly speaking we could use any coordinate for to map the texture to the surfaces but in most cases a special UV coordinate data must be created to avoid heavy distortion of the texture when rendering.

For this tutorial we'll start at defining an UV coordinate vertex attribufe which will map the texture in a way which is disconnected from other vertex attributes.

Lets jump right into code now, we must add some changes to to shader programs from the last tutorial.

First we must add a new attribute and a varying variable into the vertex shader. Fragment shader is usually the most common place where textures are used so we must pass the UV vertex data to the Fragment shader:

```glsl
#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec3 aCol; 
layout(location=2) in vec2 aUv; // UV attrib is a vec2 at index 2
out vec3 vCol; 
out vec2 vUv; // the vertex UV coord passed to on to the fragment shader

void main(){
    vCol = aCol;
    vUv = aUv; // assing the UV attribute data
    gl_Position = vec4(aPos, 0.0, 1.0);
}
```

In the fragment shader we can utilize the <code>vUv</code> varying to get the UV coordinate to visualize it as colors at first:

```glsl
#version 300 es
precision highp float;

uniform sampler2D uTex;

in vec3 vCol;
in vec2 vUv; // the varying uv data from vertex shader
out vec4 outCol;

void main(){
    outCol = texture(uTex, vUv);
}
```

## Vertex Data Changes

