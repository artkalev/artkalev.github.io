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

const fontBitmapUrl = "data:image/jpeg;base64,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Q29yZSA0LjQuMC1FeGl2MiI+CiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgICB4bWxuczpHSU1QPSJodHRwOi8vd3d3LmdpbXAub3JnL3htcC8iCiAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgIHhtbG5zOnhtcD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjc5OGU3ZjVhLWZkYTMtNDM1Ny05M2FjLTI4NjkyOTVkNTg5MiIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo3NzE1ZWZiZi1iOWY5LTQ5MWEtYTAwMy01YzJjNWJiNjU3ZjkiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpiYjlmOTM3Yy1kNjU2LTQ5OGYtYWVhZC1iNjhjZTAyNDYxNDUiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBHSU1QOkFQST0iMi4wIgogICBHSU1QOlBsYXRmb3JtPSJMaW51eCIKICAgR0lNUDpUaW1lU3RhbXA9IjE3MzY4Nzc5NjQyODM2NDEiCiAgIEdJTVA6VmVyc2lvbj0iMi4xMC4zMCIKICAgdGlmZjpPcmllbnRhdGlvbj0iMSIKICAgeG1wOkNyZWF0b3JUb29sPSJHSU1QIDIuMTAiPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjMzBlZWYxMS03MTdlLTQ3ZjktOWUyMS1jN2ZmYmM4YzA2M2EiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoTGludXgpIgogICAgICBzdEV2dDp3aGVuPSIyMDI1LTAxLTE0VDIwOjA2OjA0KzAyOjAwIi8+CiAgICA8L3JkZjpTZXE+CiAgIDwveG1wTU06SGlzdG9yeT4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/Ph+dx3YAAAACYktHRAD/h4/MvwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAAd0SU1FB+kBDhIGBG61qugAAAAZdEVYdENvbW1lbnQAQ3JlYXRlZCB3aXRoIEdJTVBXgQ4XAAACpklEQVRYw+1Y27LjIAyzMvn/X9Y+hIvtCELamZydaXgoDReDbSEbzP6XwvJLV5UPlhF0ja3z9jpOyna1pba0GYHYCTMztO0u7OaQAoqBjDskuw2OTsYpDH+yZYYG5mFNzrSHwWCG5gOYGYgFwWRWIpmrCLNr7esmOyy4qD3H4OICaMqyh9BmL2l96XuOVu/qcKx9RH4FP5X3OT5FA9GkcMwvFpjxgGGpjKXN9VGPXGIy5IqWGyuomKCecJ5G5kEUDCrmhWqviiAczbMekJbLM6udEkVwZPq9y2Y1BoVHUOgVlWX1/tqiIA5TwxozM3hkwB/emPTndOCVePw7XQVOoDS+2d50x23YxilV39AVq7MAZFg32wd4QgDZ5mgx79bqByKL/m3aoXlqSXzT7dX7aqNzVWuU1OK+TlIiElNYOkcnnibQyBWGyQHazDhLtrCGeTR4fVD2AT/P6IpxZ/C7MEUtna4wXD4fURo6KDJeFAVTWK5xYSTBVrYbtqdeauYsXLDZHiIfvHzEaIdsPYol4xDQrx/H46Wdq5ygBbCYhcvcdBrf1fzLSxYAdyBoKb/gCPgXgRLi4DWoEq2KDJNgDHX8VXYX8wxGKp5ncLNqco2cVCF32U+xOeiYji0ukxJO2ICSpep9yocOEWmWrvQrIcddQW1vKkGhp1EFBQS7MGSdAsuXRkTeeWln5N8liN9B4KBsAqMPumRz9239fNXv9Z2B0xf7G1T44iILnPO5dFfhZSJHcbhGC1LRzkJGI27P9ahhmFDpFOSYt61lNNDxyFW9kUKST0dLqALgQo7MaKQyMw0rs4DBMvVdriT3IF7aGbwpf0U439Lft4R385bDGdERn7w7fKJ3DscM7+lPW/0Z42/2gHWnujMGmb9C/lve8pa3/ED5B/rcThnifZ9OAAAAAElFTkSuQmCC";
const fontTex = new Texture2D(fontBitmapUrl);
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