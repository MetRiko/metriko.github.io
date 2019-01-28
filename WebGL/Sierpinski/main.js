// zmienne globalne
var gl_canvas; 
var gl_ctx;  
var _triangleVertexBuffer; 
var _triangleFacesBuffer; 
var _position; 
var _color; 
var _PosMatrix; 
var _MovMatrix; 
var _ViewMatrix; 
var _matrixProjection; 
var _matrixMovement; 
var _matrixView;  
var _timeLocation;
var _timeLocation2;

var _facesAmount; // triangles

var rotationSpeed = 0.001; 
var zoomRatio = -6;  

var X, Y, Z; 

function callbackCheckboxX() {
	X = document.getElementById('rotateX').checked;
}
function callbackCheckboxY() {
	Y = document.getElementById('rotateY').checked;
}
function callbackCheckboxZ() {
	Z = document.getElementById('rotateZ').checked;
}

function callbackSlider() {
	var fractalLvl = document.getElementById('sierpinskiLvl').value;
	var fractalSize = document.getElementById('sierpinskiSize').value * 0.25;

	valueText = document.getElementById('sierpinskiLvlText');
	valueText.innerHTML = fractalLvl;

	valueText2 = document.getElementById('sierpinskiSizeText');
	valueText2.innerHTML = fractalSize;

	gl_initBuffers(fractalSize, fractalLvl);
}

// funkcja główna
function runWebGL () {
	gl_canvas = document.getElementById("glcanvas");
	gl_ctx = gl_getContext(gl_canvas);    
	gl_initShaders();    
	callbackSlider();  
	gl_setMatrix();    
	gl_draw(); 
}

// pobranie kontekstu WebGL
function gl_getContext (canvas) {
	try {
		var ctx = canvas.getContext("webgl");
		ctx.viewportWidth = canvas.width;
		ctx.viewportHeight = canvas.height;    
	} catch (e) {}    
	if (!ctx) {
		document.write('Nieudana inicjalizacja kontekstu WebGL.')    
	}    
	return ctx;
}

// shadery 
function gl_initShaders () {

	// Random: 
	// mat4 temp = mat4(0.06 * fract(sin(100.0*u_timev+gl_Position.x*10.0)*100000.0));\
	// gl_Position = (temp + PosMatrix) * ViewMatrix * MovMatrix * vec4(position, 1.);\

	var vertexShader = "\
	attribute vec3 position;\
	uniform mat4 PosMatrix;\
	uniform mat4 MovMatrix;\
	uniform mat4 ViewMatrix; \
	uniform float u_timev;\
	attribute vec3 color;\
	varying vec3 vColor;\
	void main(void) {\
		gl_Position = PosMatrix * ViewMatrix * MovMatrix * vec4(position, 1.);\
		gl_Position.x += 0.25 * cos(4.0*u_timev);\
		gl_Position.y += 0.25 * sin(4.0*u_timev);\
		vColor = color;\
	}";

	var fragmentShader = "\
	precision mediump float;\
	uniform float u_time;\
	varying vec3 vColor;\
	\
	vec3 rgb2hsv(vec3 c) {\
	    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\
	    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\
	    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\
	\
	    float d = q.x - min(q.w, q.y);\
	    float e = 1.0e-10;\
	    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\
	}\
	\
	vec3 hsv2rgb(vec3 c) {\
	    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\
	    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\
	    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\
	}\
	\
	void main(void) {\
		vec3 hsv = rgb2hsv(vColor);\
		hsv.r += abs(sin(u_time)); \
		vec3 col = hsv2rgb(hsv);\
		gl_FragColor = vec4(col, 1.);\
	}";

	var getShader = function(source, type, typeString) {       
		var shader = gl_ctx.createShader(type);       
		gl_ctx.shaderSource(shader, source);
		gl_ctx.compileShader(shader);        

		if (!gl_ctx.getShaderParameter(shader, gl_ctx.COMPILE_STATUS)) {
			alert('error in' + typeString);          
			return false;
		}
		return shader;    
	};

	var shader_vertex = getShader(vertexShader, gl_ctx.VERTEX_SHADER, "VERTEX");    
	var shader_fragment = getShader(fragmentShader, gl_ctx.FRAGMENT_SHADER, "FRAGMENT");     

	var shaderProgram = gl_ctx.createProgram();    
	gl_ctx.attachShader(shaderProgram, shader_vertex);    
	gl_ctx.attachShader(shaderProgram, shader_fragment);     

	gl_ctx.linkProgram(shaderProgram);     

	_PosMatrix = gl_ctx.getUniformLocation(shaderProgram, "PosMatrix");    
	_MovMatrix = gl_ctx.getUniformLocation(shaderProgram, "MovMatrix");    
	_ViewMatrix = gl_ctx.getUniformLocation(shaderProgram, "ViewMatrix");

	_timeLocation = gl_ctx.getUniformLocation(shaderProgram, "u_time"); 
	_timeLocation2 = gl_ctx.getUniformLocation(shaderProgram, "u_timev"); 


	_position = gl_ctx.getAttribLocation(shaderProgram, "position");    
	_color = gl_ctx.getAttribLocation(shaderProgram, "color");   
	gl_ctx.enableVertexAttribArray(_position);    
	gl_ctx.enableVertexAttribArray(_color);    
	gl_ctx.useProgram(shaderProgram); 
} 


function defineCubeVertices(x, y, z, size) {
	var xs = x+size;
	var ys = y+size;
	var zs = z+size;
	var vertices = [
		// Bottom
		x,y,zs,		0,0,0,
		x,y,z,		0,0,1,
		xs,y,z,		0,1,0,
		xs,y,zs,	0,1,1,
		// Top
		x,ys,zs,	1,0,0,
		x,ys,z,		1,0,1,
		xs,ys,z,	1,1,0,
		xs,ys,zs,	1,1,1,
	];
	return vertices;
}

function defineCubeFaces(firstVertexIdx) {
	var faces = [
	   4, 7, 6, 6, 5, 4, // Top
	   0, 1, 5, 5, 4, 0, // Left wall
	   1, 2, 6, 6, 5, 1, // Back
	   2, 3, 7, 7, 6, 2, // Right
	   0, 3, 7, 7, 4, 0, // Front
	   0, 1, 2, 2, 3, 0, // Bottom
	];

	for (var i = faces.length - 1; i >= 0; i--) {
		faces[i] += firstVertexIdx;
	}

	return faces;
}

SIERPINSKI_FILLED_CUBES = [
	[0,0,0], [1,0,0], [2,0,0], [0,1,0], [2,1,0], [0,2,0], [1,2,0], [2,2,0],
	[0,0,1], [2,0,1], [0,2,1], [2,2,1],
	[0,0,2], [1,0,2], [2,0,2], [0,1,2], [2,1,2], [0,2,2], [1,2,2], [2,2,2],
];

function rSierpinski(x, y, z, size, lvl, maxLvl, vertices, faces) {
	if (lvl != maxLvl) {
		size = size / 3;
		
		SIERPINSKI_FILLED_CUBES.forEach(function(vec){
			rSierpinski(x+size*vec[0], y+size*vec[1], z+size*vec[2], size, lvl+1, maxLvl, vertices, faces);
		});
	}
	else {
		var newFaces = defineCubeFaces(vertices.value.length / 6);
		var newVertices = defineCubeVertices(x, y, z, size);

		newVertices.forEach(function(vertex) { vertices.value.push(vertex); });
		newFaces.forEach(function(face) { faces.value.push(face); });

		// vertices.value = vertices.value.concat(newVertices);
		// faces.value = faces.value.concat(newFaces);
	}
	// console.log(lvl);
}

// Return [vertices, faces]
function sierpinski(size, n) {
	var xyz = -size/2;

	var vertices = {value: []};
	var faces = {value: []};

	if(n == 0) {
		vertices.value = defineCubeVertices(xyz,xyz,xyz,size);
		faces.value = defineCubeFaces(0);
	}
	else {
		rSierpinski(xyz, xyz, xyz, size, 0, n, vertices, faces);
	}
	return {
		vertices: vertices.value,
		faces: faces.value
	};
}

// Bufory
function gl_initBuffers (fractalSize, fractalLvl) {

	var cubeData = sierpinski(fractalSize, fractalLvl);
	// console.log("FINAL: ", cubeData.vertices);

	//console.log(cubeData.vertices);

	// var triangleVertices = defineCubeVertices(-1,-1,-1,2);
	var triangleVertices = cubeData.vertices;

	_triangleVertexBuffer = gl_ctx.createBuffer();    
	gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);
	gl_ctx.bufferData(gl_ctx.ARRAY_BUFFER, new Float32Array(triangleVertices), gl_ctx.STATIC_DRAW);     

	// var triangleFaces = defineCubeFaces(0);
	var triangleFaces = cubeData.faces;
	_facesAmount = cubeData.faces.length / 3;

	_triangleFacesBuffer = gl_ctx.createBuffer();    
	gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);    
	gl_ctx.bufferData(gl_ctx.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangleFaces), gl_ctx.STATIC_DRAW); 
}  

// Macierz 
function gl_setMatrix () {    
	_matrixProjection = MATRIX.getProjection(40, gl_canvas.width/gl_canvas.height, 1, 100);    
	_matrixMovement = MATRIX.getIdentityMatrix();    
	_matrixView = MATRIX.getIdentityMatrix();    
	MATRIX.translateZ(_matrixView, zoomRatio);
}  

// Rysowanie 
function gl_draw() {    
	gl_ctx.clearColor(0.0, 0.0, 0.0, 0.0);    
	gl_ctx.enable(gl_ctx.DEPTH_TEST);    
	gl_ctx.depthFunc(gl_ctx.LEQUAL);    
	gl_ctx.clearDepth(1.0);   
	var timeOld = 0;     

	var animate = function (time) {       
		var dAngle = rotationSpeed * (time - timeOld);  

		if (X) MATRIX.rotateX(_matrixMovement, dAngle);
		if (Y) MATRIX.rotateY(_matrixMovement, dAngle);
		if (Z) MATRIX.rotateZ(_matrixMovement, dAngle);

		timeOld = time;        

		gl_ctx.viewport(0.0, 0.0, gl_canvas.width, gl_canvas.height);
		gl_ctx.clear(gl_ctx.COLOR_BUFFER_BIT | gl_ctx.DEPTH_BUFFER_BIT);        

		gl_ctx.uniformMatrix4fv(_PosMatrix, false, _matrixProjection);       
		gl_ctx.uniformMatrix4fv(_MovMatrix, false, _matrixMovement);       
		gl_ctx.uniformMatrix4fv(_ViewMatrix, false, _matrixView);        

		gl_ctx.uniform1f(_timeLocation, time*0.001);
		gl_ctx.uniform1f(_timeLocation2, time*0.001);

		gl_ctx.vertexAttribPointer(_position, 3, gl_ctx.FLOAT, false, 4*(3+3), 0);       
		gl_ctx.vertexAttribPointer(_color, 3, gl_ctx.FLOAT, false, 4*(3+3), 3*4);        

		gl_ctx.bindBuffer(gl_ctx.ARRAY_BUFFER, _triangleVertexBuffer);       
		gl_ctx.bindBuffer(gl_ctx.ELEMENT_ARRAY_BUFFER, _triangleFacesBuffer);     
		gl_ctx.drawElements(gl_ctx.TRIANGLES, _facesAmount*3, gl_ctx.UNSIGNED_SHORT, 0); 
		gl_ctx.flush();        

		window.requestAnimationFrame(animate);    
	};    
	animate(0); 
}