// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;
  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV; 
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;
  uniform sampler2D u_Sampler3;
  uniform sampler2D u_Sampler4;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -2) {                     // Solid color
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == -1) {              // UV Debug color
      gl_FragColor = vec4(v_UV, 1.0, 1.0);
    } else if (u_whichTexture == 0) {               // texture 0
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {               // texture 1
      gl_FragColor = vec4(0.4, 0.4, 0.4, 1.0) * texture2D(u_Sampler1, v_UV);   
    } else if (u_whichTexture == 2) {               // texture 2
      gl_FragColor = vec4(0.4, 0.4, 0.4, 1.0) * texture2D(u_Sampler2, v_UV);   
    } else if (u_whichTexture == 3) {               // texture 3
      gl_FragColor = texture2D(u_Sampler3, v_UV);   
    } else if (u_whichTexture == 4) {               // texture 4
      gl_FragColor = texture2D(u_Sampler4, v_UV);   
    } else {                                        
      gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
    }
  }`

// Global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_ViewMatrix;
let u_ProjectionMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_Sampler4;
let u_whichTexture;

// 32x32 map for the scene
const g_map = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];


function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", {preserveDrawingBuffer:true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
  if (!u_Sampler2) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
  if (!u_Sampler3) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_Sampler4 = gl.getUniformLocation(gl.program, 'u_Sampler4');
  if (!u_Sampler4) {
    console.log('Failed to get the storage location of u_Sampler');
    return false;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  let identityMatrix = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityMatrix.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global UI variables
let g_globalAngle = 0; // global rotation angle
let camera;

// Actions for HTML UI
function addActionsforHtmlUI(){

  // Angle Slider Events
  const angleSlider = document.getElementById('angleSlide');
  const angleDisplay = document.getElementById('angleValue');
  angleSlider.addEventListener('mousemove', function() {
    g_globalAngle = this.value;
    renderAllShapes();
    angleDisplay.textContent = this.value;
  });

  // FOV Slider Events
  const fovSlider = document.getElementById('fovSlide');
  const fovDisplay = document.getElementById('fovValue');
  fovSlider.addEventListener('mousemove', function() {
    camera.updateProjectionMatrix(this.value);
    renderAllShapes();
    fovDisplay.textContent = this.value;
  });


}

function addKeyboardEvents() {
  document.addEventListener('keydown', (ev) => {
    switch(ev.code) {
      case 'KeyW':
        camera.moveForward();
        break;
      case 'KeyS':
        camera.moveBackwards();
        break;
      case 'KeyA':
        camera.moveLeft();
        break;
      case 'KeyD':
        camera.moveRight();
        break;
      case 'KeyQ':
        camera.panLeft();
        break;
      case 'KeyE':
        camera.panRight();
        break;
    }
    renderAllShapes();
  });
}

let isDragging = false;
let lastX = -1;
let lastY = -1;

function addMouseEvents() {
  canvas.onmousedown = function(ev) {
    if (ev.buttons === 1) { // Left mouse button
      isDragging = true;
      lastX = ev.clientX;
      lastY = ev.clientY;
    }
  };

  canvas.onmouseup = function(ev) {
    isDragging = false;
  };

  canvas.onmousemove = function(ev) {
    if (isDragging) {
      const dx = ev.clientX - lastX;
      const dy = ev.clientY - lastY;

      // Sensitivity factor - adjust as needed
      const sensitivity = 0.3;

      // Calculate movement distances
      const moveX = dx * sensitivity;
      const moveY = dy * sensitivity;

      // Apply horizontal movement (left-right)
      if (moveX > 0) {
        camera.panRight(moveX);
      } else if (moveX < 0) {
        camera.panLeft(-moveX);
      }

      // Apply vertical movement (up-down)
      if (moveY > 0) {
        camera.panDown(moveY);
      } else if (moveY < 0) {
        camera.panUp(-moveY);
      }

      // Update last position
      lastX = ev.clientX;
      lastY = ev.clientY;

      // Render the scene
      renderAllShapes();
    }
  };

  // Prevent contextmenu from appearing on right click
  canvas.oncontextmenu = function(ev) {
    ev.preventDefault();
    return false;
  };
}

function initTextures() {

  let image0 = new Image();
  if (!image0) {
    console.log('Failed to create the image object');
    return false;
  }
  image0.onload = function() {
    console.log('Sky loaded');
    sendImageToTEXTURE0(image0);
  };
  image0.src = 'sky.jpg';

  let image1 = new Image();
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  image1.onload = function() {
    console.log('Grass loaded');
    sendImageToTEXTURE1(image1);
  };
  image1.src = 'grass.png';

  let image2 = new Image();
  if (!image2) {
    console.log('Failed to create the image object');
    return false;
  }
  image2.onload = function() {
    console.log('Wall loaded');
    sendImageToTEXTURE2(image2);
  };
  image2.src = 'wall.png';

  let image3 = new Image();
  if (!image3) {
    console.log('Failed to create the image object');
    return false;
  }
  image3.onload = function() {
    console.log('Tree loaded');
    sendImageToTEXTURE3(image3);
  };
  image3.src = 'tree.png';

  let image4 = new Image();
  if (!image4) {
    console.log('Failed to create the image object');
    return false;
  }
  image4.onload = function() {
    console.log('Leaves loaded');
    sendImageToTEXTURE4(image4);
  };
  image4.src = 'leaf.png';

  return true;
}

function sendImageToTEXTURE0(image) {

  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Write the image data to the texture object
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texture unit 0 to u_Sampler
  gl.uniform1i(u_Sampler0, 0);

  console.log('Texture loaded');
}

function sendImageToTEXTURE1(image) {

  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit 1
  gl.activeTexture(gl.TEXTURE1);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Write the image data to the texture object
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texture unit 1 to u_Sampler
  gl.uniform1i(u_Sampler1, 1);

  console.log('Texture loaded');
}

function sendImageToTEXTURE2(image) {

  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit 2
  gl.activeTexture(gl.TEXTURE2);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Write the image data to the texture object
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texture unit 2 to u_Sampler
  gl.uniform1i(u_Sampler2, 2);

  console.log('Texture loaded');
}

function sendImageToTEXTURE3(image) {
  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit 3
  gl.activeTexture(gl.TEXTURE3);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Write the image data to the texture object
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texture unit 3 to u_Sampler
  gl.uniform1i(u_Sampler3, 3);

  console.log('Texture loaded');
}

function sendImageToTEXTURE4(image) {
  let texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit 4
  gl.activeTexture(gl.TEXTURE4);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  // Write the image data to the texture object
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  // Pass the texture unit 4 to u_Sampler
  gl.uniform1i(u_Sampler4, 4);

  console.log('Texture loaded');
}

function main() {
  camera = new Camera();
  setupWebGL();
  connectVariablesToGLSL();

  addActionsforHtmlUI();
  addKeyboardEvents();
  addMouseEvents();

  initTextures();

  // Specify the color for clearing <canvas>
  gl.clearColor(0.5, 0.5,  0.5, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  renderAllShapes();
  requestAnimationFrame(tick);
}

let g_startTime = performance.now()/1000.0;
let g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  renderAllShapes();
  requestAnimationFrame(tick);
}



function convertCoordinatesEvenToGL(ev){
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return ([x, y]);
}

function drawMap() {
  for (let x = 0; x < g_map.length; x++) { // Ensure x stays in bounds
    for (let y = 0; y < g_map[x].length; y++) { // Ensure y stays in bounds
      if (g_map[x][y] === 1) {  // Only process if defined
        var cube = new Cube();
        cube.color = [0.5, 0.5, 0.5, 1];
        cube.textureNum = 2;
        cube.matrix.scale(1, 5, 1);
        cube.matrix.translate(x - 10, -0.15, y - 4);
        cube.renderfaster();
      }
      else if (g_map[x][y] === 2) {
        var cube = new Cube();
        cube.color = [0.4, 0.2, 0.1, 1];
        cube.textureNum = -2;
        cube.matrix.translate(x - 10, -1.0, y - 4);
        cube.renderfaster();
      }
      else if (g_map[x][y] === 3) {
        var cube = new Cube();
        cube.color = [0.2, 0.2, 0.2, 1];
        cube.textureNum = 1;
        cube.matrix.translate(x - 10, -1.4, y - 4);
        cube.renderfaster();
      }
      else if (g_map[x][y] === 4) {
        var cube = new Cube();
        cube.color = [0.8, 0.8, 0.8, 1];
        cube.textureNum = -2;
        cube.matrix.translate(x - 10, -1.3, y - 4);
        cube.renderfaster();
      }
      else if (g_map[x][y] === 5) {
        for (let i = 0; i < 6; i++) {
          var cube = new Cube();
          cube.color = [0.2, 0.8, 0.2, 1];
          cube.textureNum = 3;
          cube.matrix.translate(x - 10, -1.3 + i * 0.5, y - 4);
          cube.renderfaster();
        }
        const leafPatterns = [
          // Bottom layer (3x3, no corners)
          [
            [-1, 0], [0, -1], [0, 0], [0, 1], [1, 0]
          ],
          // Middle layer (3x3, all blocks)
          [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],  [0, 0],  [0, 1],
            [1, -1],  [1, 0],  [1, 1]
          ],
          // Top layer (plus shape)
          [
            [0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]
          ],
          [
            [0,0]
          ]
        ];
        leafPatterns.forEach((pattern, layerIndex) => {
          pattern.forEach(([dx, dz]) => {
            var leaves = new Cube();
            leaves.color = [0.2, 0.8, 0.2, 1];
            leaves.textureNum = 4;
            leaves.matrix.translate(
                (x + dx) - 10,
                -1.3 + 4 * 0.5 + layerIndex * 0.5,
                (y + dz) - 4
            );
            leaves.renderfaster();
          });
        });
      }
    }
  }
}

function renderAllShapes(){

  // Get start time
  var startTime = performance.now();

  // Set the view matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, camera.viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, camera.projectionMatrix.elements);

  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Floor
  var floor = new Cube();
  floor.color = [.76, .70, .50, 1];
  floor.textureNum = -2;
  floor.matrix.translate(0.0, -0.75, 0.0);
  floor.matrix.scale(45.0, 0.00, 55.0);
  floor.matrix.translate(-0.5, 0.0, -0.5);
  floor.renderfast();

  // Sky
  var sky = new Cube();
  sky.color = [1.0, 0.0, 0.0, 1.0];
  sky.textureNum = 0;
  sky.matrix.translate(-1,0,-1);
  sky.matrix.scale(1000,1000,1000);
  sky.matrix.translate(-.3,-.5,-.3);
  sky.renderfaster();

  // Draw the map
  drawMap();
  
  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

// Set text of a HTML element
function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to retrieve the <' + htmlID + '> element');
    return;
  }
  htmlElm.innerHTML = text;
}