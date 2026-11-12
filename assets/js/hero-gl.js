/*
 * Decision Engine — hero visual for aboladvisuals.github.io
 * A dependency-free WebGL2 scene: a GPU-animated data terrain (analytics),
 * an orbiting knowledge network with signal pulses (intelligence), feed
 * lines from data peaks into the network, and three system rings
 * (software layers). All terrain animation runs in the vertex shader, so
 * per-frame CPU work is a handful of uniforms and ~12 line endpoints.
 */
const TAU = Math.PI * 2;

/* ---------- small mat4 helpers (column-major) ---------- */
function perspective(fovy, aspect, near, far, shiftX) {
  const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, shiftX, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}
function lookAt(e, c, u) {
  let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
  let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
  let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
  l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
    -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
}
function mul(a, b) {
  const o = new Float32Array(16);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
    o[i * 4 + j] = s;
  }
  return o;
}
function invert(m) {
  const a = m, o = new Float32Array(16);
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4],
    b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6],
    b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12],
    b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  let d = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!d) return null; d = 1 / d;
  o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * d; o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * d;
  o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * d; o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * d;
  o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * d; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * d;
  o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * d; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * d;
  o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * d; o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * d;
  o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * d; o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * d;
  o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * d; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * d;
  o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * d; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * d;
  return o;
}
function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]); }
function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); }
function translate(x, y, z) { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]); }
function xform(m, p) {
  return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]];
}

/* ---------- shared field (must match GLSL `field`) ---------- */
const SPACING = 0.62;
function field(x, z, t) {
  let h = 0.55 + 0.45 * Math.sin(x * 0.55 + t * 0.6) * Math.cos(z * 0.45 - t * 0.4);
  h += 0.32 * Math.sin(Math.hypot(x - 2.0, z + 1.5) * 0.9 - t * 0.9);
  h += 0.22 * Math.cos(x * 0.21 + z * 0.33 + t * 0.25);
  h += 0.3 * Math.sin(Math.hypot(x + 2.6, z - 2.2) * 1.1 + t * 0.7);
  return h;
}
function shape(x, z, t, grid, ptr, ptrAmt) {
  let h = field(x, z, t);
  const dx = x - ptr[0], dz = z - ptr[1];
  h += ptrAmt * 0.9 * Math.exp(-(dx * dx + dz * dz) * 0.22);
  const r = Math.hypot(x, z) / (grid * SPACING * 0.5);
  const e = Math.min(Math.max((1.02 - r) / (1.02 - 0.3), 0), 1);
  const fall = e * e * (3 - 2 * e);
  return Math.max(0.05, h * h * fall * 2.1 + 0.05);
}

const GLSL_FIELD = `
float field(vec2 p, float t){
  float h = 0.55 + 0.45*sin(p.x*0.55 + t*0.6)*cos(p.y*0.45 - t*0.4);
  h += 0.32*sin(length(p - vec2(2.0,-1.5))*0.9 - t*0.9);
  h += 0.22*cos(p.x*0.21 + p.y*0.33 + t*0.25);
  h += 0.3*sin(length(p - vec2(-2.6,2.2))*1.1 + t*0.7);
  return h;
}
float shapeH(vec2 p, float t){
  float h = field(p, t);
  vec2 d = p - uPointer;
  h += uPointerAmt*0.9*exp(-dot(d,d)*0.22);
  float r = length(p)/(uGrid*${SPACING.toFixed(2)}*0.5);
  float fall = smoothstep(1.02, 0.3, r);
  return max(0.05, h*h*fall*2.1 + 0.05);
}`;

const TERRAIN_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec2 aCell;
uniform mat4 uViewProj;
uniform float uTime, uGrid, uPointerAmt;
uniform vec2 uPointer;
uniform vec3 uEye;
out vec3 vN; out vec3 vW; out vec3 vL; out float vH; out float vR;
${GLSL_FIELD}
void main(){
  vec2 p = (aCell - (uGrid-1.0)*0.5) * ${SPACING.toFixed(2)};
  float h = shapeH(p, uTime);
  float w = ${(SPACING * 0.66).toFixed(3)};
  vec3 wp = vec3(p.x + aPos.x*w, aPos.y*h, p.y + aPos.z*w);
  vN = aNormal; vW = wp; vL = vec3(aPos.x, aPos.y*h, aPos.z); vH = h;
  vR = length(p)/(uGrid*${SPACING.toFixed(2)}*0.5);
  gl_Position = uViewProj * vec4(wp, 1.0);
}`;

const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 vN; in vec3 vW; in vec3 vL; in float vH; in float vR;
uniform vec3 uEye;
out vec4 o;
vec3 ramp(float t){
  vec3 c0 = vec3(0.09,0.11,0.17);
  vec3 c1 = vec3(0.22,0.33,0.62);
  vec3 c2 = vec3(0.30,0.70,0.66);
  vec3 c3 = vec3(0.96,0.72,0.42);
  t = clamp(t,0.0,1.0);
  if(t<0.35) return mix(c0,c1,t/0.35);
  if(t<0.7) return mix(c1,c2,(t-0.35)/0.35);
  return mix(c2,c3,(t-0.7)/0.3);
}
void main(){
  vec3 n = normalize(vN);
  vec3 v = normalize(uEye - vW);
  vec3 L = normalize(vec3(0.45,0.85,0.35));
  float t = smoothstep(0.1, 3.4, vH);
  vec3 base = ramp(t);
  float diff = max(dot(n,L),0.0);
  float hemi = 0.5 + 0.5*n.y;
  float rim = pow(1.0 - max(dot(n,v),0.0), 3.0);
  // height-graded side faces: darker at the foot, brighter near the top
  float grad = mix(0.35, 1.0, smoothstep(0.0, vH, vL.y));
  vec3 col = base * (0.18 + 0.55*diff + 0.25*hemi) * grad;
  // crisp edge lines (technical wireframe accent)
  vec2 e2 = 0.5 - abs(vL.xz);
  float sideEdge = min(e2.x, e2.y);
  float topEdge = vH - vL.y;
  float isTop = step(0.5, n.y);
  float edgeD = isTop > 0.5 ? sideEdge : min(sideEdge, topEdge*1.6);
  float fw = fwidth(edgeD)*1.2 + 1e-4;
  float edge = 1.0 - smoothstep(0.0, fw*1.5, edgeD);
  col += edge * mix(vec3(0.30,0.42,0.75), vec3(1.0,0.82,0.55), smoothstep(0.5,0.95,t)) * (0.22 + 0.5*isTop);
  col += isTop * base * 0.35;
  col += rim * vec3(0.30,0.45,0.85) * 0.35;
  // fade to transparent toward the edges of the island and with distance
  float dist = length(uEye - vW);
  float fade = smoothstep(1.02, 0.55, vR) * (1.0 - smoothstep(28.0, 42.0, dist));
  o = vec4(col*fade, fade);
}`;

const LINE_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aMeta; // x: param along segment/loop, y: seed
layout(location=2) in vec3 aColor;
uniform mat4 uViewProj, uModel;
out vec2 vMeta; out vec3 vColor; out float vDepth;
void main(){
  vec4 wp = uModel*vec4(aPos,1.0);
  vMeta = aMeta; vColor = aColor;
  gl_Position = uViewProj*wp;
  vDepth = gl_Position.w;
}`;
const LINE_FS = `#version 300 es
precision highp float;
in vec2 vMeta; in vec3 vColor; in float vDepth;
uniform float uTime, uBase, uSpeed, uPulse;
out vec4 o;
void main(){
  float p = fract(uTime*uSpeed + vMeta.y);
  float d = abs(vMeta.x - p); d = min(d, 1.0-d);
  float g = exp(-d*d*uPulse);
  float fog = 1.0 - smoothstep(26.0, 40.0, vDepth);
  float a = (uBase + g*0.95)*fog;
  o = vec4(vColor*a, a*0.9);
}`;

const POINT_VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec2 aMeta; // x: size, y: seed
layout(location=2) in vec3 aColor;
uniform mat4 uViewProj, uModel;
uniform float uTime, uScale;
out vec3 vColor; out float vA;
void main(){
  vec4 wp = uModel*vec4(aPos,1.0);
  gl_Position = uViewProj*wp;
  float tw = 0.75 + 0.25*sin(uTime*1.6 + aMeta.y*6.2831);
  gl_PointSize = aMeta.x*uScale*tw*7.0/gl_Position.w;
  vColor = aColor; vA = tw*(1.0 - smoothstep(26.0, 40.0, gl_Position.w));
}`;
const POINT_FS = `#version 300 es
precision highp float;
in vec3 vColor; in float vA;
out vec4 o;
void main(){
  vec2 q = gl_PointCoord*2.0-1.0;
  float r2 = dot(q,q);
  if(r2>1.0) discard;
  float core = smoothstep(0.22, 0.0, r2);
  float halo = exp(-r2*4.5)*0.55;
  float a = (core + halo)*vA;
  o = vec4(mix(vColor, vec3(1.0), core*0.6)*a, a);
}`;

function compileStart(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh); gl.attachShader(p, sh);
  }
  gl.linkProgram(p);
  return p;
}
function compileFinish(gl, p) {
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
/* With KHR_parallel_shader_compile the driver compiles off the main thread; poll until done. */
function whenCompiled(gl, progs) {
  const ext = gl.getExtension('KHR_parallel_shader_compile');
  if (!ext) return Promise.resolve();
  return new Promise((res) => {
    const poll = () => (progs.every(p => gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR)) ? res() : setTimeout(poll, 32));
    poll();
  });
}
function isSoftware(gl) {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(r);
  } catch (e) { return false; }
}

function cubeGeometry() {
  // unit box: x,z in [-0.5,0.5], y in [0,1]; 5 faces (no bottom)
  const F = [
    [[0, 1, 0], [[-.5, 1, -.5], [-.5, 1, .5], [.5, 1, .5], [.5, 1, -.5]]],
    [[0, 0, 1], [[-.5, 0, .5], [.5, 0, .5], [.5, 1, .5], [-.5, 1, .5]]],
    [[0, 0, -1], [[.5, 0, -.5], [-.5, 0, -.5], [-.5, 1, -.5], [.5, 1, -.5]]],
    [[1, 0, 0], [[.5, 0, .5], [.5, 0, -.5], [.5, 1, -.5], [.5, 1, .5]]],
    [[-1, 0, 0], [[-.5, 0, -.5], [-.5, 0, .5], [-.5, 1, .5], [-.5, 1, -.5]]],
  ];
  const out = [];
  for (const [n, q] of F) for (const i of [0, 1, 2, 0, 2, 3]) out.push(...q[i], ...n);
  return new Float32Array(out);
}

function fibonacciSphere(n, r) {
  const pts = []; const g = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2, rad = Math.sqrt(1 - y * y), th = g * i;
    const jitter = 0.86 + 0.28 * ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    pts.push([Math.cos(th) * rad * r * jitter, y * r * 0.82 * jitter, Math.sin(th) * rad * r * jitter]);
  }
  return pts;
}

export function start(canvas, opts = {}) {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) throw new Error('webgl2 unavailable');
  const small = opts.small;
  const GRID = small ? 18 : 26;
  let still = !!opts.still;
  if (!opts.force && isSoftware(gl)) {
    // No GPU acceleration: hand over to the pre-rendered still of this same scene.
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    opts.onSoftware && opts.onSoftware();
    return null;
  }

  const pT = compileStart(gl, TERRAIN_VS, TERRAIN_FS);
  const pL = compileStart(gl, LINE_VS, LINE_FS);
  const pP = compileStart(gl, POINT_VS, POINT_FS);
  let terrain, lines, points;

  /* terrain VAO */
  const tVao = gl.createVertexArray(); gl.bindVertexArray(tVao);
  const cube = cubeGeometry();
  const cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, cube, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  const cells = new Float32Array(GRID * GRID * 2); let k = 0;
  for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) { cells[k++] = i; cells[k++] = j; }
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, cells, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
  const cubeCount = cube.length / 6;

  /* network */
  const NET_Y = 5.6, NET_R = small ? 2.8 : 3.2;
  const nodes = fibonacciSphere(small ? 30 : 46, NET_R);
  const palette = [[0.96, 0.72, 0.42], [0.54, 0.71, 1.0], [0.45, 0.85, 0.75]];
  const edges = new Set();
  nodes.forEach((a, i) => {
    const near = nodes.map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2]).filter(x => x[0] !== i).sort((x, y) => x[1] - y[1]).slice(0, 3);
    for (const [j] of near) edges.add(i < j ? i + ':' + j : j + ':' + i);
  });
  const lineData = []; const SEG = 6;
  let seed = 0;
  for (const e of edges) {
    const [i, j] = e.split(':').map(Number); const a = nodes[i], b = nodes[j];
    const c = palette[(i + j) % 3]; const s = (Math.sin(seed++ * 78.233) * 43758.5453 % 1 + 1) % 1;
    for (let q = 0; q < SEG; q++) for (const t of [q / SEG, (q + 1) / SEG]) {
      // slight outward bow so edges read as arcs
      const m = 1 + 0.08 * Math.sin(Math.PI * t);
      lineData.push((a[0] + (b[0] - a[0]) * t) * m, (a[1] + (b[1] - a[1]) * t) * m, (a[2] + (b[2] - a[2]) * t) * m, t, s, ...c);
    }
  }
  // system rings
  const ringData = [];
  const rings = [[NET_R * 1.45, 0.42, 0, palette[0]], [NET_R * 1.7, -0.28, 1.1, palette[1]], [NET_R * 1.25, 1.2, 2.2, palette[2]]];
  rings.forEach(([r, tilt, yaw, c], ri) => {
    const N = 160;
    for (let q = 0; q < N; q++) for (const t of [q / N, (q + 1) / N]) {
      const a = t * TAU; let x = Math.cos(a) * r, y = 0, z = Math.sin(a) * r * 0.92;
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      const x3 = x * Math.cos(yaw) + z2 * Math.sin(yaw), z3 = -x * Math.sin(yaw) + z2 * Math.cos(yaw);
      ringData.push(x3, y2, z3, t, ri * 0.33, ...c);
    }
  });
  function lineVao(data, dynamic) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 32, 12);
    gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 32, 20);
    return { vao, b, count: data.length / 8 };
  }
  const edgeV = lineVao(new Float32Array(lineData));
  const ringV = lineVao(new Float32Array(ringData));
  const nodeData = [];
  nodes.forEach((n, i) => nodeData.push(...n, 34 + 30 * ((i * 7) % 5) / 4, (i * 0.137) % 1, ...palette[i % 3]));
  const nodeV = lineVao(new Float32Array(nodeData));

  /* feed lines: data peaks -> network nodes (updated per frame) */
  const FEEDS = small ? 7 : 12;
  const feedCells = []; const feedNodes = [];
  for (let f = 0; f < FEEDS; f++) {
    const a = f / FEEDS * TAU + 0.4, rr = GRID * SPACING * (0.12 + 0.2 * ((f * 5) % 3) / 2);
    feedCells.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    // pick lower-hemisphere nodes so feeds rise into the sphere
    let best = 0, bd = 1e9;
    nodes.forEach((n, i) => { const d = (n[0] - feedCells[f][0] * 0.5) ** 2 + (n[1] + NET_R) ** 2 * 0.6 + (n[2] - feedCells[f][1] * 0.5) ** 2 + (feedNodes.includes(i) ? 50 : 0); if (d < bd) { bd = d; best = i; } });
    feedNodes.push(best);
  }
  const FSEG = 10;
  const feedArr = new Float32Array(FEEDS * FSEG * 2 * 8);
  const feedV = lineVao(feedArr, true);
  const feedTops = new Float32Array(FEEDS * 8);
  const feedTopV = lineVao(feedTops, true);

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  let W = 1, H = 1, dpr = 1;
  const state = { t: opts.time || 7.3, ptr: [100, 100], ptrTarget: [100, 100], ptrAmt: 0, ptrAmtTarget: 0, mx: 0, my: 0, tmx: 0, tmy: 0, running: false, raf: 0, last: 0, visible: true, paused: false, scroll: 0 };
  let viewProj = null, eye = [0, 0, 0];

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
    W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    if (still || !state.running) frame(performance.now(), true);
  }

  function camera() {
    const aspect = W / H;
    const wide = aspect > 1.15;
    const az = 0.78 + (still ? 0 : state.t * 0.045) + state.mx * 0.22;
    const el = 0.6 + state.my * 0.05 - state.scroll * 0.1;
    const R = (wide ? 25 : 23) - state.scroll * 2;
    const target = [0, 2.9, 0];
    eye = [target[0] + R * Math.cos(el) * Math.cos(az), target[1] + R * Math.sin(el), target[2] + R * Math.cos(el) * Math.sin(az)];
    const shift = opts.shift != null ? opts.shift : (wide ? (aspect > 1.9 ? -0.68 : -0.62) : 0);
    const proj = perspective(wide ? 0.62 : 0.78, aspect, 0.5, 60, shift);
    viewProj = mul(proj, lookAt(eye, target, [0, 1, 0]));
  }

  function pointerToGround(cx, cy) {
    if (!viewProj) return null;
    const inv = invert(viewProj); if (!inv) return null;
    const x = cx * 2 - 1, y = 1 - cy * 2;
    const p0 = mulVec4(inv, [x, y, -1, 1]), p1 = mulVec4(inv, [x, y, 1, 1]);
    const a = [p0[0] / p0[3], p0[1] / p0[3], p0[2] / p0[3]], b = [p1[0] / p1[3], p1[1] / p1[3], p1[2] / p1[3]];
    const dy = b[1] - a[1]; if (Math.abs(dy) < 1e-5) return null;
    const t = (0.9 - a[1]) / dy; if (t < 0) return null;
    return [a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t];
  }
  function mulVec4(m, v) {
    return [0, 1, 2, 3].map(i => m[i] * v[0] + m[4 + i] * v[1] + m[8 + i] * v[2] + m[12 + i] * v[3]);
  }

  let ready = false;
  const frameTimes = [];
  function frame(now, force) {
    if (!ready) return;
    if (!force && (!state.running)) return;
    if (!force && !still && state.last) {
      frameTimes.push(now - state.last);
      if (frameTimes.length === 45) {
        const m = frameTimes.slice().sort((a, b) => a - b)[22];
        if (m > 45) { still = true; stop(); opts.onStill && opts.onStill('slow'); return; }
      }
    }
    const dt = Math.min(0.05, state.last ? (now - state.last) / 1000 : 0.016); state.last = now;
    if (!still && !force) state.t += dt;
    const ease = 1 - Math.pow(0.001, dt);
    state.mx += (state.tmx - state.mx) * ease * 0.6; state.my += (state.tmy - state.my) * ease * 0.6;
    state.ptr[0] += (state.ptrTarget[0] - state.ptr[0]) * ease; state.ptr[1] += (state.ptrTarget[1] - state.ptr[1]) * ease;
    state.ptrAmt += (state.ptrAmtTarget - state.ptrAmt) * ease * 0.5;
    camera();
    const t = state.t;
    gl.viewport(0, 0, W, H);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // terrain
    gl.useProgram(terrain.p);
    gl.uniformMatrix4fv(terrain.u.uViewProj, false, viewProj);
    gl.uniform1f(terrain.u.uTime, t); gl.uniform1f(terrain.u.uGrid, GRID);
    gl.uniform2f(terrain.u.uPointer, state.ptr[0], state.ptr[1]); gl.uniform1f(terrain.u.uPointerAmt, state.ptrAmt);
    gl.uniform3fv(terrain.u.uEye, eye);
    gl.bindVertexArray(tVao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, cubeCount, GRID * GRID);

    // network model matrix
    const model = mul(translate(0, NET_Y + Math.sin(t * 0.5) * 0.12, 0), mul(rotY(t * 0.12), rotX(0.18)));
    const ident = translate(0, 0, 0);

    // feed lines (CPU mirrors the shader height so lines meet the column tops)
    let o = 0, ot = 0;
    for (let f = 0; f < FEEDS; f++) {
      const [x, z] = feedCells[f];
      const ci = Math.round(x / SPACING + (GRID - 1) / 2), cj = Math.round(z / SPACING + (GRID - 1) / 2);
      const px = (ci - (GRID - 1) / 2) * SPACING, pz = (cj - (GRID - 1) / 2) * SPACING;
      const h = shape(px, pz, t, GRID, state.ptr, state.ptrAmt);
      const a = [px, h + 0.02, pz], b = xform(model, nodes[feedNodes[f]]);
      const c = palette[f % 3];
      for (let q = 0; q < FSEG; q++) for (const s of [q / FSEG, (q + 1) / FSEG]) {
        const lift = Math.sin(s * Math.PI) * 0.6;
        feedArr.set([a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s + lift, a[2] + (b[2] - a[2]) * s, s, f * 0.173, c[0], c[1], c[2]], o); o += 8;
      }
      feedTops.set([a[0], a[1] + 0.04, a[2], 26, f * 0.31, c[0], c[1], c[2]], ot); ot += 8;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, feedV.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, feedArr);
    gl.bindBuffer(gl.ARRAY_BUFFER, feedTopV.b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, feedTops);

    gl.depthMask(false);
    gl.useProgram(lines.p);
    gl.uniformMatrix4fv(lines.u.uViewProj, false, viewProj);
    gl.uniform1f(lines.u.uTime, t);
    // edges
    gl.uniformMatrix4fv(lines.u.uModel, false, model);
    gl.uniform1f(lines.u.uBase, 0.16); gl.uniform1f(lines.u.uSpeed, 0.22); gl.uniform1f(lines.u.uPulse, 60.0);
    gl.bindVertexArray(edgeV.vao); gl.drawArrays(gl.LINES, 0, edgeV.count);
    // rings
    gl.uniform1f(lines.u.uBase, 0.12); gl.uniform1f(lines.u.uSpeed, 0.05); gl.uniform1f(lines.u.uPulse, 260.0);
    gl.bindVertexArray(ringV.vao); gl.drawArrays(gl.LINES, 0, ringV.count);
    // feeds
    gl.uniformMatrix4fv(lines.u.uModel, false, ident);
    gl.uniform1f(lines.u.uBase, 0.22); gl.uniform1f(lines.u.uSpeed, 0.35); gl.uniform1f(lines.u.uPulse, 40.0);
    gl.bindVertexArray(feedV.vao); gl.drawArrays(gl.LINES, 0, feedV.count);

    // nodes + feed sources
    gl.useProgram(points.p);
    gl.uniformMatrix4fv(points.u.uViewProj, false, viewProj);
    gl.uniform1f(points.u.uTime, t); gl.uniform1f(points.u.uScale, dpr * (W / dpr < 700 ? 0.85 : 1.0));
    gl.uniformMatrix4fv(points.u.uModel, false, model);
    gl.bindVertexArray(nodeV.vao); gl.drawArrays(gl.POINTS, 0, nodeV.count);
    gl.uniformMatrix4fv(points.u.uModel, false, ident);
    gl.bindVertexArray(feedTopV.vao); gl.drawArrays(gl.POINTS, 0, FEEDS);
    gl.depthMask(true);

    if (state.running) state.raf = requestAnimationFrame(frame);
  }

  function play() {
    if (still || state.running || state.paused || !state.visible || document.hidden) return;
    state.running = true; state.last = 0; state.raf = requestAnimationFrame(frame);
  }
  function stop() { state.running = false; cancelAnimationFrame(state.raf); }

  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; state.visible ? play() : stop(); });
  io.observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : play()));

  if (!still) {
    const host = opts.pointerTarget || canvas;
    host.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const r = canvas.getBoundingClientRect();
      const cx = (ev.clientX - r.left) / r.width, cy = (ev.clientY - r.top) / r.height;
      state.tmx = (cx - 0.5) * 2; state.tmy = (cy - 0.5) * 2;
      const g = pointerToGround(cx, cy);
      if (g && Math.hypot(g[0], g[1]) < GRID * SPACING * 0.55) { state.ptrTarget = g; state.ptrAmtTarget = 1; } else state.ptrAmtTarget = 0;
    }, { passive: true });
    host.addEventListener('pointerleave', () => { state.ptrAmtTarget = 0; state.tmx = 0; state.tmy = 0; });
    window.addEventListener('scroll', () => {
      const r = canvas.getBoundingClientRect();
      state.scroll = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      if (!state.running && !still) frame(performance.now(), true);
    }, { passive: true });
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); opts.onLost && opts.onLost(); });

  resize();
  whenCompiled(gl, [pT, pL, pP]).then(() => {
    try {
      terrain = compileFinish(gl, pT); lines = compileFinish(gl, pL); points = compileFinish(gl, pP);
    } catch (e) { opts.onLost && opts.onLost(); return; }
    ready = true;
    frame(performance.now(), true);
    opts.onReady && opts.onReady();
    play();
  });
  return {
    pause() { state.paused = true; stop(); },
    resume() { state.paused = false; play(); },
    get paused() { return state.paused; },
  };
}
