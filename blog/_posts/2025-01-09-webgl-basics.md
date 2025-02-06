---
title: "WebGL2 Basics: Hello Triangle"
---

<iframe src="/assets/demos/triangle/hello.html" style="width:100%;height:auto;aspect-ratio:16/9"></iframe>

This is a tutorial article on the basics of drawing with WebGL2. There are a lot of great tutorials on this topic so I aim to provide a concise and more of a quickstart style tutorial.

## HTML Boilerplate

Lets define a minimal boilerplate for html.

```html
<!DOCTYPE html>
    <head>
    </head>
    <body>
        <script>
            // next code snippets will be placed here
        </script>
    </body>
</html>
```

## WebGL2 Context

Lets start adding javascript into the script element. Getting the WebGL Rendering Context 2 is simple:
```javascript
const canvas = document.createElement("canvas");
const gl = canvas.getContext("webgl2");
```

## Rendering Something

Before going any further lets make sure that our canvas and webgl context is working.

```javascript
document.body.appendChild(canvas); // makes the canvas visible
gl.clearColor(0,1,1,1); // sets the color for clearing
gl.clear(gl.COLOR_BUFFER_BIT); // actually clears the canvas to color
```

The <code>gl.clearColor</code> accepts rgba values as normalized in 0.0 to 1.0 range. You should see that the canvas is now filled with the given color:

<iframe src="/assets/demos/triangle/clear.html"></iframe>

## Geometry Drawing Prerequisites

Our purpose is to draw a single triangle. There are a few things that need to be defined to do this:

- Vertex Position Buffer
- Vertex Color Buffer
- Vertex Array Object (VAO)
- Vertex Shader
- Fragment Shader
- Shader Program

## Vertex Position Buffer

We must create a buffer(array of values) that will be passed on to the GPU by WebGL2, which defines the positions of the vertices of the triangle.

The triangle needs to be defined in the Normalized Device Coordinate(NDC) space which is essentially a cube with the minimum at (-1,-1,-1) and maximum at (+1,+1,+1).
<iframe src="/assets/demos/triangle/ndc.html" style="width:100%;height:auto;aspect-ratio:16/9"></iframe>
This cube is the volume in which everything is drawn by WebGL. This means that all the mesh coordinates must fit into this cube to be visible.


Lets start with defining a typed javascript array for the positions:
```javascript
const positions = new Float32Array([
   // X     Y
    -1.0, -1.0, // left bottom corner
     1.0, -1.0, // right bottom corner
     0.0,  1.0  // center top corner
]);
```
Notice that the data consists of 2D vectors but is structured as a flat array of floats.

Now we can define the WebGL buffer and pass the data to it. WebGL(OpenGL) has a global state that we need to manipulate. For example passing some data to a buffer involves these steps:

- Make a buffer "active" (bind a buffer).
- Pass data to the currently active buffer.

This is how these steps look in the WebGL context:

```javascript
const position_buffer = gl.createBuffer();

gl.bindBuffer(       // makes the buffer "active"
    gl.ARRAY_BUFFER, // buffer type
    position_buffer  // our buffer
);
gl.bufferData(       // moves data to the buffer
    gl.ARRAY_BUFFER, // target active buffer type
    positions,       // our data
    gl.STATIC_DRAW   // buffer usage hint. not importat atm
);
```

## Vertex Color Buffer

Defining the color buffer follows the same steps with one exception to make it more optimal.

Instead of using a <code>Float32Array</code> lets use an <code>Uint8Array</code> This reduces the amount of memory we need to use.

```javascript
const colors = new Uint8Array([
  // R , G , B
    255,  0,  0, // red
      0,255,  0, // green 
      0,  0,255  // blue
]);

const color_buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
```

## Vertex Array Object (VAO)

Now we have defined both the vertex position and color data buffers. But it is a good idea to also define the Vertex Array Object as well. This makes using these buffers easier and faster later.

VAO is a WebGL object that "records" the vertex attribute information. Remember that we only defined 2 buffers of data, but webgl does not yet have any idea about the structure of these data buffers and how to use them.

```javascript
const vao = gl.createVertexArray();

gl.bindVertexArray(vao); // start "recording"

// position attribute data
gl.bindBuffer(gl.ARRAY_BUFFER, position_buffer); // our position buffer
gl.enableVertexAttribute(0); // enables vertex attrib at location 0
gl.vertexAttribPointer(
    0, // attrib location
    2, // components per element: vec2 for our postition data
    gl.FLOAT, // buffer data type: we have Float32Array
    false, // whether the data is normalized to 0.0 1.0 range in shaders
    0, // stride, not important atm
    0 // offset, not important atm
);

// color attribute data
gl.bindBuffer(gl.ARRAY_BUFFER, color_buffer);
gl.enableVertexAttribute(1);
gl.vertexAttribPointer(
    1, // attrib location
    3, // components per element: 
    gl.UNSIGNED_BYTE, // we have Uint8Array
    true, // the 0..255 is normalized into 0.0...1.0 in shaders
    0,
    0
);

gl.bindVertexArray(null); // end "recording"
```

At this point we have the necessary preparations done for the triangle vertex data, but we cannot draw the triangle yet. We also need the Shader Program.

## Vertex Shader

Lets start with the vertex shader. This shader code controls per vertex data when drawing. For this tutorial the vertex shader can be extremely simple. We only need to get the vertex position and color data and pass them on as-is.

The simplest way is to write the GLSL shader code in a string:
```javascript
const vertex_shader_code = `#version 300 es

    // ^^^
    // the version definition has to be the first line in
    // the string.

    // sets the precision level for all float and vec
    // data types
    precision highp float;

    // this is the vertex attribute at index 0
    // which we defined in the vertex array object.
    // we can use any name for this in the glsl code
    // the important bit is the location=0
    layout(location=0) in vec2 aPos;

    // this is the color attrib at index: 1
    layout(location=1) in vec2 aCol;

    // this is the interpolate color which is
    // passed to the fragment shader
    out vec3 vCol;

    void main(){
        vCol = aCol; // just pass through the value 

        // vertex position for the shader program
        // always a vec4 value
        gl_Position = vec4(aPos, 0.0, 1.0);
    }
```

The comments inflate this code a bit but this is as simple a vertex shader as it can get. Now lets create the webgl shader object:
```javascript
const vertex_shader = gl.createShader(gl.VERTEX_SHADER);
```

Next we must pass this code string into a shader object on the GPU:
```javascript
gl.shaderSource(vertex_shader, vertex_shader_code);
```

The next step is to compile the shader code on the GPU. This can be done with <code>gl.compileShader</code>. It is also good idea to add some debugging in case the compilation fails:
```javascript
gl.compileShader(vertex_shader);
if(!gl.getShaderParameter(vertex_shader, gl.COMPILE_STATUS)){
    throw new Error("failed to compile vertex shader:"+gl.getShaderInfoLog(vertex_shader));
}
```
If there are no compilation errors then the vertex shader is ready now.

## Fragment Shader

Fragment shader controls the look of the pixels that will be rendered. while the vertex shader code is executed for every vertex, the fragment shader is executed for every pixel which would be rendered.

Vertex data can also be passed into the fragment shader. In our program the vertex color data is passed to the fragment shader to color the triangle. In the end of this tutorial you can see how the colors are interpolated on the triangle face.

Fragment shader code looks a bit different from vertex shader code:
```javascript
const fragment_shader_code = `#version 300 es
    precision highp float;

    in vec3 vCol; // the data from vertex shader

    // fragment output value
    // essentially the color of the output pixel
    out vec4 outCol;

    void main(){
        outCol = vec4(vCol, 1.0);
    }
```

Next we can define the shader object and compile the shader like we did with the vertex shader:
```javascript
const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragment_shader, fragment_shader_code);
gl.compileShader(fragment_shader);
if(!gl.getShaderParameter(fragment_shader, gl.COMPILE_STATUS)){
    throw new Error("failed to compile fragment shader:"+gl.getShaderInfoLog(fragment_shader));
}
```

Now we have both the vertex shader and fragment shader compiled.

## Shader Program

In order to use these shaders they must be added to a shader program. In this tutorial we will not do anything more with the shader program.

```javascript
const shader_program = gl.createProgram();
gl.attachShader(shader_program, vertex_shader);
gl.attachShader(shader_program, fragment_shader);
gl.linkProgram(shader_program);

// also debug the program status
if(!gl.getProgramParameter(shader_program, gl.LINK_STATUS)){
    throw new Error("failed to link shader program:"+gl.getProgramInfoLog(shader_program));
}
```

After all this work, we finally have defined all the components that are necessary to draw the triangle.

## Finally Drawing the Triangle

Now we can put all the things together to draw the triangle. The actual code for this is quite short:

```javascript
gl.bindVertexArray(vao); // our vertex array object
gl.useProgram(shader_program); // our shader program
gl.drawArrays(
    gl.TRIANGLES, // drawing mode
    0, // index of the first vertex to draw
    3  // number of vertices to draw
);
```

The result is a triangle with interpolated vertex colors on it.

<iframe src="/assets/demos/triangle/hello.html" style="width:100%;height:auto;aspect-ratio:16/9"></iframe>

Drawing a single triangle might seem simplistic but it is a necessary first step to drawing something more complex.

I hope this introduction into WebGL2 has been useful for someone. In the next tutorial we will be creating a UV vertex attribute and drawing a texture in the fragment shader.

Next: [WebGL Basics: Texture]({% post_url 2025-02-06-webgl-basics-texture %})