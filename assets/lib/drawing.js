/*

    JS 3D schematics drawing library.
    author: Kalev Mölder 2025

    Contains classes to make drawing
    simple lines and shapes in 3D space
    fast and easy using WebGL2

*/

///////////////////
// 3D math start //
///////////////////

function calculateViewMatrix(targetMatrix, cameraPosition, targetPoint, upVector = [0, 1, 0]) {
    function normalize(vec) {
        const length = Math.sqrt(vec[0] ** 2 + vec[1] ** 2 + vec[2] ** 2);
        if (length > 0) {
            vec[0] /= length;
            vec[1] /= length;
            vec[2] /= length;
        }
        return vec;
    }

    function subtract(out, a, b) {
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }

    function cross(out, a, b) {
        const x = a[1] * b[2] - a[2] * b[1];
        const y = a[2] * b[0] - a[0] * b[2];
        const z = a[0] * b[1] - a[1] * b[0];
        out[0] = x;
        out[1] = y;
        out[2] = z;
        return out;
    }

    function dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    // Temporary vectors
    const forward = [0, 0, 0];
    const right = [0, 0, 0];
    const up = [0, 0, 0];

    // Calculate the camera axes
    subtract(forward, cameraPosition, targetPoint); // Z axis (negative direction)
    normalize(forward);

    cross(right, upVector, forward); // X axis
    normalize(right);

    cross(up, forward, right); // Y axis (orthogonal to forward and right)

    // Update the target matrix
    targetMatrix[0] = right[0];
    targetMatrix[1] = up[0];
    targetMatrix[2] = forward[0];
    targetMatrix[3] = 0;

    targetMatrix[4] = right[1];
    targetMatrix[5] = up[1];
    targetMatrix[6] = forward[1];
    targetMatrix[7] = 0;

    targetMatrix[8] = right[2];
    targetMatrix[9] = up[2];
    targetMatrix[10] = forward[2];
    targetMatrix[11] = 0;

    targetMatrix[12] = -dot(right, cameraPosition);
    targetMatrix[13] = -dot(up, cameraPosition);
    targetMatrix[14] = -dot(forward, cameraPosition);
    targetMatrix[15] = 1;

    return targetMatrix;
}

function calculatePerspectiveMatrix(targetMatrix, fov, aspect, near, far) {
    const f = 1.0 / Math.tan((fov * Math.PI) / 360); // Convert FOV to radians and compute cotangent
    const nf = 1 / (near - far);

    targetMatrix[0] = f / aspect;
    targetMatrix[1] = 0;
    targetMatrix[2] = 0;
    targetMatrix[3] = 0;

    targetMatrix[4] = 0;
    targetMatrix[5] = f;
    targetMatrix[6] = 0;
    targetMatrix[7] = 0;

    targetMatrix[8] = 0;
    targetMatrix[9] = 0;
    targetMatrix[10] = (far + near) * nf;
    targetMatrix[11] = -1;

    targetMatrix[12] = 0;
    targetMatrix[13] = 0;
    targetMatrix[14] = 2 * far * near * nf;
    targetMatrix[15] = 0;

    return targetMatrix;
}

/////////////////
// 3D math end //
/////////////////

const vertexShaderSource = `#version 300 es
    precision highp float;
    layout(location=0) in vec3 aPos;
    layout(location=1) in vec4 aCol;
    layout(location=2) in vec2 aUv;

    uniform mat4 uViewMatrix;
    uniform mat4 uProjMatrix;

    out vec4 vCol;
    out vec2 vUv;

    void main(){
        vCol = aCol;
        vUv = aUv;
        gl_Position = uProjMatrix * uViewMatrix * vec4(aPos, 1.0);    
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;

    uniform sampler2D uTexture;
    uniform int uUseTexture;

    in vec4 vCol;
    in vec2 vUv;
    out vec4 outCol;
    void main(){
        outCol = vCol;
        if(uUseTexture == 1){
            outCol = texture(uTexture, vUv); 
        }   
    }
`;

class ShaderProgram{
    constructor(vscode, fscode){
        this.vscode = vscode;
        this.fscode = fscode;
        this.prog = null;
        this.vs = null;
        this.fs = null;
        this.isCompiled = false;
        this.isValid = false;
        this.uniformLocations = {};
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} name 
     * @returns {WebGLUniformLocation}
     */
    getUniformLocation(gl, name){
        if(!this.isCompiled){ return null; }
        if(name in this.uniformLocations){
            return this.uniformLocations[name];
        }else{
            const loc = gl.getUniformLocation(this.prog, name);
            this.uniformLocations[name] = loc;
            return loc;
        }
    }

    /**
     * ShortHand for getUniformLocation(gl, name)
     * @param {WebGL2RenderingContext} gl 
     * @param {string} name 
     * @returns {WebGLUniformLocation}
     */
    getU(gl, name){
        return this.getUniformLocation(gl, name);
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} name 
     * @param {Float32Array} value 
     */
    setMatrix(gl, name, value){
        const loc = this.getU(gl, name);
        if(loc === null){
            console.warn("uniform "+name+" not found in the shader program");
        }else{
            gl.uniformMatrix4fv(loc, false, value);
        }
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} name 
     * @param {number} value 
     */
    setInt(gl, name, value){
        const loc = this.getU(gl, name);
        if(loc === null){
            console.warn("uniform "+name+" not found in the shader program");
        }else{
            gl.uniform1i(loc, value);
        }
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    compile(gl){
        this.vs = gl.createShader(gl.VERTEX_SHADER);
        this.fs = gl.createShader(gl.FRAGMENT_SHADER);
        this.prog = gl.createProgram();

        gl.shaderSource(this.vs, this.vscode);
        gl.shaderSource(this.fs, this.fscode);

        gl.compileShader(this.vs);
        gl.compileShader(this.fs);

        if(!gl.getShaderParameter(this.vs, gl.COMPILE_STATUS)){
            this.isValid = false;
            this.isCompiled = true;
            console.error("failed to compile vertex shader: "+gl.getShaderInfoLog(this.vs));
            return;
        }

        if(!gl.getShaderParameter(this.fs, gl.COMPILE_STATUS)){
            this.isValid = false;
            this.compile = true;
            console.error("failed to compile fragment shader: " + gl.getShaderInfoLog(this.fs));
            return;
        }

        gl.attachShader(this.prog, this.vs);
        gl.attachShader(this.prog, this.fs);
        gl.linkProgram(this.prog);

        this.isCompiled = true;
        this.isValid = true;
    }

    /**
     * @param {WebGL2RenderingContext} gl 
     */
    use(gl){
        if(!this.isCompiled){
            this.compile(gl);
        }
        if(this.isCompiled && !this.isValid){
            throw new Error("Failed to compile the shader Program");
        }
        gl.useProgram(this.prog);
    }
}

class Texture2D{
    /**
     * 
     * @param {string} url 
     */
    constructor(url) {
        this.tex = null;
        this.url = url;
        this.img = new Image();
        this.isInitialized = false;
        this.needsUpdate = false;
        this.img.onload = ()=>{
            this.needsUpdate = true;
        }
        this.img.src = this.url;
    }

    /** @param {WebGL2RenderingContext} gl */
    init(gl){
        this.tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.isInitialized = true;
    }

    /** @param {WebGL2RenderingContext} gl */
    update(gl){
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.needsUpdate = false;
    }

    /** 
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {number} index
     */
    bind(gl, index){
        if(!this.isInitialized){this.init(gl);}
        if(this.needsUpdate){
            this.update(gl);
        }
        gl.activeTexture(gl.TEXTURE0 + index);
        gl.bindTexture(gl.TEXTURE_2D, this.tex);
    }
}

const prog_default = new ShaderProgram(vertexShaderSource, fragmentShaderSource);

class MeshAttr{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {ArrayBufferView} data 
     * @param {number} size 
     * @param {GLenum} type 
     * @param {boolean} normalized 
     */
    constructor(gl, data, size, type, normalized){
        this.data = data;
        this.size = size;
        this.type = type;
        this.normalized = normalized;
        this.buffer = gl.createBuffer();
        this.updateDataBuffer(gl);
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    updateDataBuffer(gl){
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.data, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

class Mesh{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {MeshAttr[]} attributes 
     * @param {Uint16Array | null} indices index buffer data or null if not used
     * @param {GLenum} mode gl drawing mode 
     * @returns 
     */
    constructor(gl, attributes, indices, mode){
        this.mode = mode;
        this.program = prog_default;
        this.indexData = indices;
        this.indexBuffer = null;
        this.hasIndexBuffer = false;
        this.isValid = false;
        if(attributes.length == 0){
            console.warn("no attributes for mesh");
            return;
        }
        this.vao = gl.createVertexArray();
        this.attributes = attributes;
        this.vertexCount = attributes[0].data.length / attributes[0].size;

        gl.bindVertexArray(this.vao);
        for(let i = 0; i < this.attributes.length; i++){
            gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes[i].buffer);
            gl.enableVertexAttribArray(i);
            gl.vertexAttribPointer(
                i,
                this.attributes[i].size,
                this.attributes[i].type,
                this.attributes[i].normalized,
                0, 0
            );
        }
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        if(indices != null){
            this.indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
            this.hasIndexBuffer = true;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }

        this.isValid = true;
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     */
    draw(gl, viewMatrix, projMatrix){

        this.program.use(gl);
        this.program.setMatrix(gl, "uViewMatrix", viewMatrix);
        this.program.setMatrix(gl, "uProjMatrix", projMatrix);

        gl.bindVertexArray(this.vao);
        if(this.hasIndexBuffer){
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            gl.drawElements(this.mode, this.indexData.length, gl.UNSIGNED_SHORT, 0);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        }else{
            gl.drawArrays(this.mode, 0, this.vertexCount); 
        }
        gl.bindVertexArray(null);
    }
}

class LineMesh extends Mesh{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {Float32Array} points 
     * @param {Uint8Array} colors 
     */
    constructor(gl, points, colors){
        const attributes = [
            new MeshAttr(gl, points, 3, gl.FLOAT, false),
            new MeshAttr(gl, colors, 4, gl.UNSIGNED_BYTE, true)
        ];
        super(gl, attributes, null, gl.LINES);
    }
}

const fontBitmapUrl = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAABACAIAAABdtOgoAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gYUEA8DtmwMkgAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAN8SURBVHja7VzZbgMhDAwR///L6UOlFcUH4wOyTTwPVYRgF4yvMWwfj8Kd8Xq92JapnW1ku9E+V/tyuPLYG8oNXNFz9+YpQr9+tNZaa/hjp86tNUUhju0WXdE0Mc+rkTGvv9Btgj5W74nPh7U23KoSXcUohKVAEizgVx/Hv6NWsiIYVfi3J24BcXFIRqmrlMko2WXmxADTdOke6EFl+bpNFhAxC/YVk+Jvd4CsoKkIFNsMeqFgDHDLZfm06AaYhGJKY+huufcgqFam4fgM2TXibq1Q+A60ybLGYM02Xu1X42RQtN3RU3n7YQa6nJK+TGhFUpwE03ZfWNNfZI1jIGc2sX33PE0r6pKKsY1ZCXvkOe7ZSvZnIiIp8XN8V9flMnkbSrh9HowSMVYouXusiHjag3FddBRSYPD4T5zjICavezAwa464EYWaSYQR5BYSz8IbR3RF998S/RLdl6TX4APxxsgSmjU5UfwPmDOwT4tkQZt0RXLIko+6fpuzoELhu4kYazKsXzJxLt029WdKw5fOUBkeJE3Lno4VobzDUfzzVQQdiQRb5T/GpEzlcfZ38pFkenhBAizLpP5LxbGn1EN2kEbKAU0bj/Nbx4pYwuhTvp5C+lmRSeHEZEzBogXyapwfsE5cp81LPN/uf3QZBWsSEZe447BaY8JIfF/KSJ/uFLuuc3yfW7OKBn/R1XO5B/h84s6qUPhUbEqQldIjftvFnVzldnOMApe562piG6DHRmmWyhkLmNu8kQrg9y27LzGY8jDaiDMpU7Ix3b+zpkCRk94HfPYyndouixkbT2V3NOZ63U0nvfi5U7dWAhRld1QRDifdjh3NIvwLlyjdLUSKXO6Km6mAddtcw7ErjAWwCkiJknvB4HknEpz1pYKE0VHhYYdPjSAPLSJWKCT668MJzB0icyKe7hygHFnmBij32SWS7fj8iv0OQK9YmHrSD7J8PU/eDfVwLqnsAxKraQ/2VaLcKWMWEUNoWk+xo/jpldVfL2+R0hOrkxV5mtZL83z61h+pfwVPqWiRS6n6ScMdicP43efyAgBbNGTn2cEkx3p6FVS3HdoqMabx/GtpVdI3tuy1H9pe+UuhEOcpx77/L9yidv/Z6A9LQdG6ecfS08/Ud2uxm2UiZRmHvE0JOloLKi/xTt1X/o9EZUGFQqFQKBQKhUKhUCgUCp+CH1iG6b/UPSErAAAAAElFTkSuQmCC";
const fontTex = new Texture2D(fontBitmapUrl);

class TextMesh extends Mesh{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} text 
     */
    constructor(gl, text){
        const verts = [];
        const cols = [];
        const uvs = [];

        for(let i = 0; i < text.length; i++){
            console.log(text[i]);
        }

        const attributes = [
            new MeshAttr(gl, new Float32Array(verts), 2, gl.FLOAT, false),
            new MeshAttr(gl, new Uint8Array(cols), 4, gl.UNSIGNED_BYTE, true),
            new MeshAttr(gl, new Float32Array(uvs), 2, gl.FLOAT, false)
        ];
        super(gl, attributes, null, gl.LINES);
        this.text = text;
    }

    draw(gl, viewMatrix, projMatrix){
        this.program.use(gl);
        this.program.setMatrix(gl, "uViewMatrix", viewMatrix);
        this.program.setMatrix(gl, "uProjMatrix", projMatrix);
        this.program.setInt(gl, "uUseTexture", 1);
        this.program.setInt(gl, "uTexture", 0);
        fontTex.bind(gl, 0);
    }
}

export class Drawing{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas, gl){
        /** @type {Mesh[]} */
        this.meshes = [];
        /** @type {WebGL2RenderingContext} */
        this.gl = gl;
        /** @type {HTMLCanvasElement} */
        this.canvas = canvas;

        this.bg = [0,0,0,1];

        this.viewPos = [0,0,3];
        this.viewTarget = [0,0,0];
        this.viewMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        this.projMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);

        calculateViewMatrix(this.viewMatrix, this.viewPos, this.viewTarget);
        calculatePerspectiveMatrix(this.projMatrix, 90, 1, 0.01, 100.0);
    }

    addLines(points, colors){
        this.meshes.push(
            new LineMesh(this.gl, points, colors)
        );
    }

    /**
     * 
     * @param {number} w 
     * @param {number} h 
     * @param {number} d 
     */
    addLineCube(w,h,d){
        const x = w / 2;
        const y = h / 2;
        const z = d / 2;

        const vertices = new Float32Array([
            -x, -y, -z, // 0
            x, -y, -z, // 1
            x,  y, -z, // 2
            -x,  y, -z, // 3
            -x, -y,  z, // 4
            x, -y,  z, // 5
            x,  y,  z, // 6
            -x,  y,  z  // 7
        ]);

        const colors = new Uint8Array([
              0,  0,  0,255,
            255,  0,  0,255,
            255,255,  0,255,
              0,255,  0,255,
              0,  0,255,255,
            255,  0,255,255,
            255,255,255,255,
              0,255,255,255
        ]);

        const indices = new Uint16Array([
            0, 1, 1, 2, 2, 3, 3, 0, // Bottom face
            4, 5, 5, 6, 6, 7, 7, 4, // Top face
            0, 4, 1, 5, 2, 6, 3, 7  // Vertical edges
        ]);


        this.meshes.push(
            new Mesh(this.gl,
                [
                    new MeshAttr(this.gl, vertices, 3, this.gl.FLOAT, false),
                    new MeshAttr(this.gl, colors, 4, this.gl.UNSIGNED_BYTE, true )
                ],
                indices,
                this.gl.LINES
            )
        );
    }

    addText(x,y,z, text){
        this.meshes.push(
            new TextMesh(this.gl, text)
        );
    }

    draw(){
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.gl.viewport(0,0,this.canvas.width, this.canvas.height);
        this.gl.clearColor(this.bg[0], this.bg[1], this.bg[2], this.bg[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        this.gl.uniformMatrix4fv(this.__viewMatLoc, false, this.viewMatrix);
        this.gl.uniformMatrix4fv(this.__projMatLoc, false, this.projMatrix);

        for(let i = 0; i < this.meshes.length; i++){
            this.meshes[i].draw(this.gl, this.viewMatrix, this.projMatrix);
        }
    }
}