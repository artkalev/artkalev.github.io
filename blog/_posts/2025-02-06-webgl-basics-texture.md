---
title: "WebGL2 Basics: Texture"
---

This is a tutorial article on the basics of using textures while drawing with WebGL2. It builds upon the [last tutorial]({% post_url 2025-01-09-webgl-basics %}) where we were drawing a triangle with vertex colors.

## UV Coordinates

Before we get to creating and loading textures, we must be aquinted with texture coordinates (UVs).

Texture coordinates are needed to define how the 2D texture image is mapped on the triangles of the geometry in the 3D space. The uv coordinate space is normalized so that the whole image is contained between:
- <code>vec2(0.0, 0.0)</code>
- <code>vec2(1.0, 1.0)</code>

## UV Attribute

Strictly speaking we could use any coordinate to map the texture to the surfaces but in most cases a special UV coordinate data must be created to avoid heavy distortion of the texture when rendering.

For this tutorial we'll start at defining the UV coordinate vertex attribute which allows us to control the texture mapping independently from the vertex position attribute.

Find the lines with the vertex data from the last tutorial code and lets add new data array.

```javascript
// existing data
const vertex_pos_data = new Float32Array([
    -1.0, -1.0, 
     1.0, -1.0, 
     0.0,  1.0
]);
const vertex_color_data = new Uint8Array([
    255,   0,   0,
        0, 255,   0,
        0,   0, 255
]);

// new data for texture coordinates
const vertex_uv_data = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.5, 1.0
]);
```

Next we can create the WebGL buffer for the attribute.

```javascript
// existing buffers
const vertex_pos_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_pos_buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertex_pos_data, gl.STATIC_DRAW);
const vertex_color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertex_color_data, gl.STATIC_DRAW);

// new buffer
const vertex_uv_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_uv_buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertex_uv_data, gl.STATIC_DRAW);
```

The VertexArrayObject also has to be modified to use the new attribute while drawing. Lets enable and add the new vertex attribute pointer.

```javascript
gl.bindBuffer(gl.ARRAY_BUFFER, vertex_uv_buffer);
gl.enableVertexAttribArray(2);
gl.vertexAttribPointer(
    2, // uv attribute index: 2: aPos;
    2, // uv is vec2
    gl.FLOAT,
    false,
    0, 0
);
```

At this point we have the new UV attribute data available when drawing but the visual would look the same if looking at the triangle now.

## Shader Modifications

To visualize the new attribute, we must modify the vertex and fragment shader. Lets start with adding the new attibute into vertex shader.

```glsl
#version 300 es
precision highp float;
layout(location=0) in vec2 aPos;
layout(location=1) in vec3 aCol;
layout(location=2) in vec2 aUv; // texture coordinate attribute bound at location 2

out vec3 vCol;
out vec2 vUv; // varying uv data to use in fragment shader

void main(){
    vCol = aCol;
    vUv = aUv; // simply passing through the value
    gl_Position = vec4(aPos, 0.0, 1.0);
}
```

Now we can use the <code>vUv</code> in the fragment shader to make it visible on the triangle instead of <code>vCol</code>.

```glsl
#version 300 es
precision highp float;

in vec3 vCol;
in vec2 vUv;
out vec4 outCol; // output fragment color

void main(){
    outCol = vec4(vUv, 0.0, 1.0);
    //                  ^
    //     need extra argument because vUv is vec2!
}
```

Now we can see that the triangle colors are different!

<iframe src="/assets/demos/triangle/texture_uv.html"></iframe>

## WebGL Texture

With the texture coordinate(UV) data prepared, the next step is to create a texture object. Lets create a 5x5 RGB texture from scratch at first. After that we will look at loading an image file.

We can start by creating an array for the pixel data similarly to the vertex data.

The next code can be placed at the end of the current javascript just before the drawing calls:

```javascript

// creating texture pixel data
// having the alpha channel data might seem redundant here
// but webgl expects pixel row byte count to be divisible
// by 4, which means its safer to use RGBA instead of RGB
const texture_pixels = new Uint8Array([
    50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,
    50, 50, 50,255,  50, 50, 50,255,   0,255,  0,255,  50, 50, 50,255,  50, 50, 50,255,
    50, 50, 50,255, 255,  0,  0,255, 255,255,255,255, 255,  0,255,255,  50, 50, 50,255,
    50, 50, 50,255,  50, 50, 50,255,   0,  0,255,255,  50, 50, 50,255,  50, 50, 50,255,
    50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,  50, 50, 50,255,
    /*
        +---+---+---+---+---+    The data results in an image
        |   |   |   |   |   |    with a colored cross in the 
        +---+---+---+---+---+    middle of dark grey pixels
        |   |   | # |   |   |    
        +---+---+---+---+---+               GREEN
        |   | # | # | # |   |         RED   WHITE   MAGENTA
        +---+---+---+---+---+               BLUE
        |   |   | # |   |   |
        +---+---+---+---+---+    Color coding the cross helps to
        |   |   |   |   |   |    check if the UV coordinates have
        +---+---+---+---+---+    the right orientation
    */
]);

// drawing calls from last tutorial
gl.clearColor(0,0,0,1);
gl.clear(gl.COLOR_BUFFER_BIT);
// start drawing the triangle
gl.useProgram(shader_program);
gl.bindVertexArray(vao);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

The pixel data is formatted as a flat uint8 array. Similarly to the vertex attributes, we must "tell" webgl how this data needs to be used. So lets create a webgl texture object and assign the data to it.

```javascript
const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(
    gl.TEXTURE_2D, // target
    0, // level
    gl.RGBA, // internal format
    5, // width
    5, // height
    0, // border
    gl.RGBA, // format
    gl.UNSIGNED_BYTE, // type
    texture_pixels // data
);
```

The way this works is similar to <code>gl.vertexAttribPointer</code> but it describes how to use the pixel data array we have for the texture object.

In addition to the data, it's a good idea to also setup some parameters for the texture. These control how the pixels are scaled and wether to let the texture repeat if the UV coordinates exeed the 0.0 ... 1.0 range.

```javascript
// filtering to use when texels are smaller than fragments
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
// filtering to use when texels are larger than fragments
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
// wrapping mode for S(horizontal, X) axis
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
// wrapping mode for T(vertical, Y) axis
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
```

The <code>NEAREST</code> filter is good to use with such a small texture like ours. Otherwise it would look very blurry as texel density is very low on our triangle.

"Texels" refer to texture pixels sampled by the fragment shader. In our case the triangle would cover hundreds of pixels but the texture is only 5x5 pixels. This means that the filtering of these pixels on the triangle fragments have a large impact on the look of the triangle.

## Using the Texture

Textures have to be bound to some "texture unit" in webgl to use them with shader programs.

```javascript
// sets texture 0 as active unit
gl.activeTexture(gl.TEXTURE0);
// binds texture into currently active unit
gl.bindTexture(gl.TEXTURE_2D, texture);
```

Now we have a texture active at unit 0 but we don't have the glsl code in the fragment shader to use the texture and make it visible on the triangle.

## Uniforms

Using textures in a shader program necessitates the use of something called a "uniform". Uniforms are a way to set variable values from CPU side in Shader Programs on the GPU before drawing.

In our case, we need to pass the texture unit index into a "sampler2D" uniform in the fragment shader. Lets start with modifying the fragment shader.

```glsl
#version 300 es
precision highp float;

// the uniform declaration
// can be any name.
uniform sampler2D uTex0;

in vec3 vCol;
in vec2 vUv;
out vec4 outCol;

void main(){

    // reading the texture at current vUv coordinate
    vec4 pixel = texture(uTex0, vUv);

    outCol = pixel;
}
```

Depending on the device and/or gpu, the texture might already be visible because the TEXTURE0 unit is active by default and uniform values default to zero, but the uniform value might also be uninitialized(random) value. So its a good idea to set the uniform explicitly before drawing.

Before we can set the uniform value, we must get its "location" in the compiled shader program.

```javascript
const uTex0Location = gl.getUniformLocation(
    shader_program, // our shader program
    "uTex0" // the uniform name in glsl code
);
```

Now that the uniform location is known, we can use it to set the uniform value. In this case the "sampler2D" is an integer type which refers to which texture unit to use. WebGL has different setter functions for every uniform data type. We need the <code>gl.uniform1i(location, value)</code>. This sets a single integer.

```javascript
gl.useProgram(shader_program);
// its important to call this after gl.useProgram()
// because uniforms are set on the currently active program
gl.uniform1i(uTex0Location, 0);
```

A triangle with our pixel cross texture should be visible now.

<iframe src="/assets/demos/triangle/texture_data.html"></iframe>

## Image File

The pixel cross was a demonstration of how the pixel data handling works but in the real world applications usually need to load textures from image files.

In the webgl context we must use javascript Image object to load the file and update the webgl texture pixel data after the image has loaded.

We must also wrap our drawing logic into a function because we need to redraw the triangle once the image has loaded and the texture data updated. Lets start with wrapping the drawing related function calls:

```javascript
function draw(){
    gl.clearColor(0,0,0,1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shader_program);
    const uTex0Location = gl.getUniformLocation(shader_program, "uTex0");
    gl.uniform1i(uTex0Location, 0);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

draw(); // first draw with the current cross texture
```

The image can be loaded as usual with javascript but we need extra code in the <code>onload</code> callback of the <code>Image</code> object.

```javascript
const img = new Image();

// executed when the image has been loaded
img.onload = () => {
    // binding the texture created before
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // assigning new data to the texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    // changing the filtering method
    // my test texture is quite high resolution
    // so it looks better with LINEAR filtering
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    draw(); // redrawing the triangle to display new texture
};

// it's important to define the onload method 
// before setting the src.

img.src = "./tex.png" // the path to image file
```

Unfortunately modern browsers will block the image loading request when you are opening the html file directly. Use any http serving software to serve html under localhost. <code>python -m http.server</code> is a quick and simple way to host some directory under localhost for example.

Now you should see that the cross texture is replaced with the image file on the triangle.

<iframe src="/assets/demos/triangle/texture_data_load.html"></iframe>

## Texture Coordinate Math

Now is a good time to build some intuition on texture sampling coordinates in the fragment shader. Lets start with simply multiplying the coordinate with some constant vec2.

```glsl
vec2 uv = vUv;
uv *= 8.0;
vec4 pixel = texture(uTex0, uv);
```

<iframe src="/assets/demos/triangle/texture_data_uv_mult.html"></iframe>

This is where the <code>gl.REPEAT</code> texture parameter value from earlier comes into play. When the sampling coordinate is higher than 1.0 or lower than 0.0 it is wrapped to 0.0 ... 1.0 range again. This makes the texture appear to repeat.

Now lets try some more complex coordinate manipulation:

```glsl
vec2 uv = vUv;
uv.x *= sin(vUv.x * 6.0);
uv.y *= sin(vUv.y * 6.0);
vec4 pixel = texture(uTex0, uv);
```

<iframe src="/assets/demos/triangle/texture_data_uv_warp.html"></iframe>

The result is a variable scaling of the coordinates across the triangle. This is a simple effect but I think it demonstrates the possibilities of manipulating the texture coordinates well.

## The End

The amount of information might seem a bit overwhelming at first, but I hope you have gained some intuition on how using textures works in webgl application context.

Next tutorial will be on the topic of framebuffers.