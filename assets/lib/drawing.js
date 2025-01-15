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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
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
        this.lineWidth = 2;
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
        this.program.setInt(gl, "uUseTexture", 0);

        gl.lineWidth(this.lineWidth);

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

const fontTex = new Texture2D("/assets/lib/charmap-oldschool_white.png");
const glyphCoords = [
    [" ","!",'"',"#","$","%","&","'","(",")","*","+",",","-",".","/","0","1"],
    ["2","3","4","5","6","7","8","9",":",";","<","=",">","?","@","A","B","C"],
    ["D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U"],
    ["V","W","X","Y","Z","[","/","]","^","_","`","a","b","c","d","e","f","g"],
    ["h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y"],
    ["z","{","|","}","~"],
    []
];
const glyphCount = [18, 7];
function getGlyphCoord(char){
    for(let y = 0; y < glyphCoords.length; y++){
        for(let x = 0; x < glyphCoords[y].length; x++){
            if(glyphCoords[y][x] == char){
                return [x, y];
            }
        }
    }
    return null;
}

class TextMesh extends Mesh{
    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} text 
     */
    constructor(gl, x,y,z, text, scale=0.1){
        const verts = [];
        const cols = [];
        const uvs = [];

        for(let i = 0; i < text.length; i++){
            console.log(text[i]);
            const px0 = i*scale + x;
            const py0 = y;
            const px1 = i*scale+scale + x;
            const py1 = scale + y;
            verts.push( 
                px0,py0,z, px1,py0,z, px1,py1,z,
                px0,py0,z, px1,py1,z, px0,py1,z
            );

            const coord = getGlyphCoord(text[i]);
            if(coord === null){continue;}
            const u0 = coord[0] / glyphCount[0];
            const v0 = coord[1] / glyphCount[1];
            const u1 = (coord[0]+1) / glyphCount[0];
            const v1 = (coord[1]+1) / glyphCount[1];
            uvs.push( 
                u0,v1, u1,v1, u1,v0,
                u0,v1, u1,v0, u0,v0 
            );
        }

        const attributes = [
            new MeshAttr(gl, new Float32Array(verts), 3, gl.FLOAT, false),
            new MeshAttr(gl, new Uint8Array(cols), 4, gl.UNSIGNED_BYTE, true),
            new MeshAttr(gl, new Float32Array(uvs), 2, gl.FLOAT, false)
        ];
        super(gl, attributes, null, gl.TRIANGLES);
        this.text = text;
    }

    draw(gl, viewMatrix, projMatrix){
        this.program.use(gl);
        this.program.setMatrix(gl, "uViewMatrix", viewMatrix);
        this.program.setMatrix(gl, "uProjMatrix", projMatrix);
        this.program.setInt(gl, "uUseTexture", 1);
        this.program.setInt(gl, "uTexture", 0);
        fontTex.bind(gl, 0);

        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
        gl.bindVertexArray(null);
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

        this.viewPos = [0,0,1.5];
        this.viewTarget = [0,0,0];
        this.viewMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        this.projMatrix = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
        this.viewNeedsUpdate = true;

        calculateViewMatrix(this.viewMatrix, this.viewPos, this.viewTarget);
        calculatePerspectiveMatrix(this.projMatrix, 50, 1, 0.01, 100.0);
    }

    addLines(points, colors, lineWidth=2){
        const m = new LineMesh(this.gl, points, colors)
        m.lineWidth = lineWidth;
        this.meshes.push(m);
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
            new TextMesh(this.gl, x,y,z, text)
        );
    }

    draw(){
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.gl.viewport(0,0,this.canvas.width, this.canvas.height);
        this.gl.clearColor(this.bg[0], this.bg[1], this.bg[2], this.bg[3]);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);
        this.gl.lineWidth(2);

        if(this.viewNeedsUpdate){
            calculateViewMatrix(this.viewMatrix, this.viewPos, this.viewTarget);
            calculatePerspectiveMatrix(this.projMatrix, 50, this.canvas.width / this.canvas.height, 0.01, 100.0);
            this.viewNeedsUpdate = false;
        }

        for(let i = 0; i < this.meshes.length; i++){
            this.meshes[i].draw(this.gl, this.viewMatrix, this.projMatrix);
        }
    }
}