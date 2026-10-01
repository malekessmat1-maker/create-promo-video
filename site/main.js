import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* =====================================================================
   HADAL · scroll-driven descent
   World units: 1 unit = 10 m of depth. Camera y = -depth / 10.
   ===================================================================== */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COARSE = matchMedia('(pointer: coarse)').matches;
const LOW_POWER = COARSE || innerWidth < 760;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

const state = {
  depth: 0, targetDepth: 0, velocity: 0,
  mouse: new THREE.Vector2(0, 0), smouse: new THREE.Vector2(0, 0),
  lights: 'auto', subPose: { x: 4.2, y: -0.3, z: 0, s: 1.2 }, time: 0,
};

/* ---------------------------------------------------------------------
   Renderer, scene, camera
   --------------------------------------------------------------------- */
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW_POWER, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW_POWER ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 300);
camera.position.set(0, 0, 12);

const COLOR_STOPS = [
  [0, '#1b8ba0'], [80, '#126f8c'], [200, '#0a4565'], [600, '#06263d'],
  [1200, '#03121f'], [2500, '#020a14'], [4000, '#01060c'],
].map(([d, c]) => [d, new THREE.Color(c)]);
const waterColor = new THREE.Color();
function colorAtDepth(d, out) {
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [d0, c0] = COLOR_STOPS[i], [d1, c1] = COLOR_STOPS[i + 1];
    if (d <= d1) return out.copy(c0).lerp(c1, clamp((d - d0) / (d1 - d0), 0, 1));
  }
  return out.copy(COLOR_STOPS[COLOR_STOPS.length - 1][1]);
}
scene.background = colorAtDepth(0, new THREE.Color());
scene.fog = new THREE.FogExp2(scene.background.clone(), 0.03);

/* Lights */
const hemi = new THREE.HemisphereLight('#c9f7ff', '#05283a', 2.4);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#e6fbff', 2.6);
sun.position.set(-4, 20, 6);
scene.add(sun);
const rim = new THREE.DirectionalLight('#62e6ff', 0.9);
scene.add(rim, rim.target);

/* Shared glow sprite texture */
function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,0.25)') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, inner); grd.addColorStop(0.25, mid); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW = glowTexture();
const glowSprite = (color, size, opacity = 1) => {
  const m = new THREE.SpriteMaterial({ map: GLOW, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size); return s;
};

/* ---------------------------------------------------------------------
   Surface: caustics + Snell's window, seen from below
   --------------------------------------------------------------------- */
const surfaceMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    varying vec2 vUv; uniform float uTime; uniform float uOpacity;
    float caustic(vec2 p, float t){
      float w = sin(p.x*1.3 + t) + sin(p.y*1.7 - t*1.1) + sin((p.x+p.y)*0.9 + t*0.7) + sin(length(p - 3.0)*1.2 - t*0.9);
      return pow(1.0 - abs(w) / 4.0, 9.0);
    }
    void main(){
      vec2 c = vUv - 0.5; float r = length(c);
      vec2 p = vUv * 70.0;
      float k = caustic(p, uTime*0.9) + 0.6*caustic(p*1.7 + 4.0, uTime*1.3);
      float snell = smoothstep(0.16, 0.0, r);
      vec3 col = mix(vec3(0.10,0.55,0.66), vec3(0.62,0.98,1.0), clamp(k*0.9 + snell*0.8, 0., 1.));
      float a = (0.05 + k*0.32 + snell*0.3) * smoothstep(0.5, 0.1, r) * uOpacity;
      gl_FragColor = vec4(col, a);
    }`,
});
const surface = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), surfaceMat);
surface.rotation.x = Math.PI / 2;
surface.position.set(0, 7.5, -10);
scene.add(surface);

/* God rays */
const rayMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
  vertexShader: `varying vec2 vUv; varying float vSeed; attribute float aSeed; void main(){ vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
  fragmentShader: `
    varying vec2 vUv; varying float vSeed; uniform float uTime; uniform float uIntensity;
    void main(){
      float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
      float fall = pow(vUv.y, 2.2);
      float flicker = 0.55 + 0.45 * sin(uTime * 0.6 + vSeed * 12.0);
      float a = edge * fall * flicker * uIntensity * 0.12;
      gl_FragColor = vec4(vec3(0.75, 0.97, 1.0) * a, a);
    }`,
});
const rays = new THREE.Group();
for (let i = 0; i < 14; i++) {
  const w = 1.2 + Math.random() * 3.2, h = 60;
  const geo = new THREE.PlaneGeometry(w, h);
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Array(4).fill(Math.random()), 1));
  const m = new THREE.Mesh(geo, rayMat);
  m.position.set(-22 + Math.random() * 44, 7.5 - h / 2, -24 + Math.random() * 22);
  m.rotation.set(0, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.35 + 0.12);
  rays.add(m);
}
scene.add(rays);

/* ---------------------------------------------------------------------
   Marine snow + bioluminescent plankton (infinite, wraps around camera)
   --------------------------------------------------------------------- */
function particleField({ count, color, size, deep, spread = [40, 60, 40] }) {
  const pos = new Float32Array(count * 3), seed = new Float32Array(count), col = new Float32Array(count * 3);
  const palette = Array.isArray(color) ? color.map(c => new THREE.Color(c)) : [new THREE.Color(color)];
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = Math.random() * spread[1];
    pos[i * 3 + 2] = -spread[2] * 0.75 + Math.random() * spread[2];
    seed[i] = Math.random();
    const c = palette[(Math.random() * palette.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 }, uCamY: { value: 0 }, uH: { value: spread[1] }, uSize: { value: size },
      uPixel: { value: renderer.getPixelRatio() }, uAlpha: { value: 1 }, uMouse: { value: new THREE.Vector2(9, 9) },
      uAspect: { value: innerWidth / innerHeight }, uDeep: { value: deep ? 1 : 0 },
    },
    vertexShader: `
      attribute float aSeed; attribute vec3 aColor;
      uniform float uTime, uCamY, uH, uSize, uPixel, uAspect, uDeep; uniform vec2 uMouse;
      varying float vA; varying vec3 vCol; varying float vGlow;
      void main(){
        vec3 p = position;
        float rise = uTime * (0.08 + aSeed * 0.25);
        p.y = mod(p.y + rise - uCamY + uH * 0.5, uH) + uCamY - uH * 0.5;
        p.x += sin(uTime * 0.35 + aSeed * 40.0) * 0.4;
        p.z += cos(uTime * 0.25 + aSeed * 30.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        vec2 ndc = gl_Position.xy / gl_Position.w;
        float md = distance(ndc * vec2(uAspect, 1.0), uMouse * vec2(uAspect, 1.0));
        vGlow = uDeep * smoothstep(0.45, 0.0, md);
        float twinkle = uDeep > 0.5 ? (0.35 + 0.65 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 50.0), 3.0)) : 1.0;
        gl_PointSize = uSize * (0.35 + aSeed) * uPixel * (1.0 + vGlow * 2.2) * (30.0 / -mv.z);
        float fade = exp(-pow(-mv.z * 0.035, 2.0));
        vA = fade * twinkle;
        vCol = aColor;
      }`,
    fragmentShader: `
      uniform float uAlpha; varying float vA; varying vec3 vCol; varying float vGlow;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float s = smoothstep(0.5, 0.0, d);
        float a = min(1.0, s * s * vA * uAlpha * (1.0 + vGlow * 2.0));
        gl_FragColor = vec4(vCol * (1.0 + vGlow * 1.5), a);
      }`,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}
const snow = particleField({ count: LOW_POWER ? 1400 : 2800, color: '#d8eef0', size: 1.6, deep: false });
const plankton = particleField({ count: LOW_POWER ? 900 : 1800, color: ['#72f2e4', '#5ad1ff', '#8a6cf0', '#9dfff0'], size: 3.2, deep: true });
scene.add(snow, plankton);

/* ---------------------------------------------------------------------
   Fish school (sunlight → twilight)
   --------------------------------------------------------------------- */
const FISH = LOW_POWER ? 90 : 180;
const fishGeo = new THREE.ConeGeometry(0.06, 0.34, 6); fishGeo.rotateX(Math.PI / 2);
const fishMat = new THREE.MeshStandardMaterial({ color: '#cfe4ea', metalness: 0.9, roughness: 0.28 });
const fish = new THREE.InstancedMesh(fishGeo, fishMat, FISH);
const fishData = Array.from({ length: FISH }, () => ({
  r: 2.5 + Math.random() * 3.5, s: 0.35 + Math.random() * 0.25, p: Math.random() * Math.PI * 2,
  y: (Math.random() - 0.5) * 2.2, w: Math.random() * Math.PI * 2,
}));
const fishCenter = new THREE.Vector3(-3, -13, -9);
const dummy = new THREE.Object3D();
scene.add(fish);
function updateFish(t) {
  for (let i = 0; i < FISH; i++) {
    const f = fishData[i], a = t * f.s + f.p;
    const x = Math.cos(a) * f.r, z = Math.sin(a) * f.r * 0.55, y = f.y + Math.sin(a * 2 + f.w) * 0.6;
    const a2 = a + 0.05;
    dummy.position.set(fishCenter.x + x, fishCenter.y + y, fishCenter.z + z);
    dummy.lookAt(fishCenter.x + Math.cos(a2) * f.r, fishCenter.y + f.y + Math.sin(a2 * 2 + f.w) * 0.6, fishCenter.z + Math.sin(a2) * f.r * 0.55);
    dummy.updateMatrix();
    fish.setMatrixAt(i, dummy.matrix);
  }
  fish.instanceMatrix.needsUpdate = true;
}

/* ---------------------------------------------------------------------
   Jellyfish: pulsing fresnel bells + CPU-animated tentacles
   --------------------------------------------------------------------- */
const bellGeo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
const jellies = [];
const JELLY_COLORS = ['#72f2e4', '#b08cff', '#ff8ad8', '#7fc8ff', '#ffd27a'];
function makeJelly(x, depthM, z, scale, color) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPhase: { value: Math.random() * 6.28 }, uColor: { value: new THREE.Color(color) }, uGlow: { value: 1 } },
    vertexShader: `
      uniform float uTime, uPhase; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv; varying float vDist;
      void main(){
        vec3 p = position;
        float pulse = sin(uTime * 1.7 + uPhase);
        float rim = 1.0 - p.y;
        p.xz *= 1.0 - 0.17 * pulse * rim;
        p.y *= 0.72 + 0.1 * pulse;
        vY = position.y; vUv = uv;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vDist = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uGlow; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv; varying float vDist;
      void main(){
        float fres = pow(1.0 - abs(dot(vN, vV)), 2.2);
        float ribs = pow(abs(sin(vUv.x * 3.14159 * 8.0)), 14.0) * smoothstep(0.0, 0.7, 1.0 - vY);
        float rimGlow = smoothstep(0.25, 0.0, vY) * 0.6;
        float a = (0.06 + fres * 0.85 + ribs * 0.45 + rimGlow) * uGlow;
        a *= exp(-pow(vDist * 0.03, 2.0));
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const bell = new THREE.Mesh(bellGeo, mat);
  group.add(bell);
  const core = glowSprite(color, 2.2, 0.35); core.position.y = 0.3; group.add(core);

  const TENT = 9, SEG = 22;
  const tentacles = [];
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  for (let k = 0; k < TENT; k++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
    const line = new THREE.Line(g, lineMat);
    line.frustumCulled = false;
    const isArm = k < 3;
    tentacles.push({ line, theta: (k / TENT) * Math.PI * 2, len: isArm ? 2.2 : 3.4 + Math.random() * 2, r: isArm ? 0.18 : 0.88, arm: isArm });
    group.add(line);
  }
  group.position.set(x, -depthM / 10, z);
  group.scale.setScalar(scale);
  group.rotation.z = (Math.random() - 0.5) * 0.4;
  scene.add(group);
  jellies.push({ group, mat, core, tentacles, baseY: -depthM / 10, phase: mat.uniforms.uPhase.value, SEG });
}
[
  [7, 260, -6, 1.1], [-8, 330, -14, 1.4], [3.5, 420, -10, 0.8], [9, 520, -8, 1.0], [-5, 640, -16, 1.6],
  [6, 760, -4, 0.9], [10, 940, -12, 1.3], [-9, 1100, -9, 1.0], [4, 1350, -14, 1.5], [8, 1620, -6, 0.9],
  [-6, 1900, -11, 1.2], [9, 2150, -9, 1.1], [3, 2450, -16, 1.6], [-8, 2800, -10, 1.0], [7, 3150, -7, 1.2],
  [-4, 3450, -15, 1.4], [9, 3650, -12, 1.0],
].forEach(([x, d, z, s], i) => makeJelly(LOW_POWER ? x * 0.6 : x, d, z, s, JELLY_COLORS[i % JELLY_COLORS.length]));

function updateJellies(t, camY) {
  for (const j of jellies) {
    const near = Math.abs(j.baseY - camY) < 26;
    j.group.visible = near;
    if (!near) continue;
    j.mat.uniforms.uTime.value = t;
    const pulse = Math.sin(t * 1.7 + j.phase);
    j.group.position.y = j.baseY + Math.sin(t * 0.35 + j.phase) * 0.8 + pulse * 0.08;
    j.group.rotation.y = t * 0.1 + j.phase;
    j.core.material.opacity = 0.25 + 0.2 * (0.5 + 0.5 * pulse);
    for (const tn of j.tentacles) {
      const arr = tn.line.geometry.attributes.position.array;
      const squeeze = 1.0 - 0.17 * pulse;
      const bx = Math.cos(tn.theta) * tn.r * squeeze, bz = Math.sin(tn.theta) * tn.r * squeeze;
      for (let s = 0; s < j.SEG; s++) {
        const k = s / (j.SEG - 1);
        const sway = Math.sin(t * 1.3 - k * 4.0 + tn.theta * 2 + j.phase) * 0.35 * k;
        const curl = tn.arm ? Math.sin(t * 0.9 + k * 6 + tn.theta) * 0.15 * k : 0;
        arr[s * 3] = bx * (1 - k * 0.3) + sway + curl;
        arr[s * 3 + 1] = -k * tn.len - (1 - squeeze) * 0.6 * k;
        arr[s * 3 + 2] = bz * (1 - k * 0.3) + Math.cos(t * 1.1 - k * 3.0 + tn.theta) * 0.25 * k;
      }
      tn.line.geometry.attributes.position.needsUpdate = true;
    }
  }
}

/* ---------------------------------------------------------------------
   Siphonophore: a 40-unit glowing colonial chain in the twilight zone
   --------------------------------------------------------------------- */
const SIPH = 260;
const siphPos = new Float32Array(SIPH * 3), siphT = new Float32Array(SIPH);
for (let i = 0; i < SIPH; i++) { siphT[i] = i / (SIPH - 1); }
const siphGeo = new THREE.BufferGeometry();
siphGeo.setAttribute('position', new THREE.BufferAttribute(siphPos, 3));
siphGeo.setAttribute('aT', new THREE.BufferAttribute(siphT, 1));
const siphMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPixel: { value: renderer.getPixelRatio() } },
  vertexShader: `
    attribute float aT; uniform float uTime, uPixel; varying float vT; varying float vF;
    void main(){
      vT = aT;
      vec3 p = vec3((aT - 0.5) * 46.0, sin(aT * 9.0 + uTime * 0.5) * 1.6 + sin(aT * 23.0 + uTime) * 0.3, cos(aT * 7.0 + uTime * 0.4) * 3.0);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      float bead = 0.5 + 0.5 * sin(aT * 260.0);
      gl_PointSize = (2.0 + bead * 4.0) * uPixel * (30.0 / -mv.z);
      vF = exp(-pow(-mv.z * 0.03, 2.0));
    }`,
  fragmentShader: `
    uniform float uTime; varying float vT; varying float vF;
    void main(){
      float d = length(gl_PointCoord - 0.5); float s = smoothstep(0.5, 0.0, d);
      float wave = 0.4 + 0.6 * pow(0.5 + 0.5 * sin(vT * 40.0 - uTime * 3.0), 4.0);
      vec3 c = mix(vec3(0.45, 0.95, 0.9), vec3(1.0, 0.72, 0.3), step(0.92, fract(vT * 31.0)));
      gl_FragColor = vec4(c, s * wave * vF);
    }`,
});
const siphonophore = new THREE.Points(siphGeo, siphMat);
siphonophore.position.set(4, -76, -14);
siphonophore.rotation.set(0.1, -0.35, 0.18);
siphonophore.frustumCulled = false;
scene.add(siphonophore);

/* ---------------------------------------------------------------------
   Anglerfish lure near the bottom
   --------------------------------------------------------------------- */
const angler = new THREE.Group();
const lure = glowSprite('#ffc46b', 1.6, 1);
const lureCore = glowSprite('#fff2cf', 0.35, 1);
const lureLight = new THREE.PointLight('#ffb547', 6, 8, 1.4);
const stalkGeo = new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.6, 0.9, 0), new THREE.Vector3(-1.6, 0.2, 0)).getPoints(20));
const stalk = new THREE.Line(stalkGeo, new THREE.LineBasicMaterial({ color: '#3b2a20', transparent: true, opacity: 0.8 }));
angler.add(lure, lureCore, lureLight, stalk);
angler.position.set(-6.5, -372, -5);
scene.add(angler);

/* ---------------------------------------------------------------------
   Seafloor at 4,060 m with tube worms and drifting sediment
   --------------------------------------------------------------------- */
const floorGeo = new THREE.PlaneGeometry(220, 160, 150, 110);
floorGeo.rotateX(-Math.PI / 2);
const FLOOR_Y = -408, FLOOR_Z = -12;
function floorHeight(x, z) {
  let h = Math.sin(x * 0.08) * 1.6 + Math.cos(z * 0.11) * 1.3 + Math.sin((x + z) * 0.21) * 0.5 + Math.sin(x * 0.9) * Math.cos(z * 0.7) * 0.12;
  h += Math.max(0, 1 - Math.hypot(x - 14, z + 26) / 18) * 9; // a ridge, back right
  h += Math.max(0, 1 - Math.hypot(x + 24, z + 34) / 22) * 12;
  return h;
}
{
  const p = floorGeo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, floorHeight(p.getX(i), p.getZ(i)));
  floorGeo.computeVertexNormals();
}
const floor = new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ color: '#59616a', roughness: 0.97, metalness: 0, flatShading: true }));
floor.position.set(0, FLOOR_Y, FLOOR_Z);
scene.add(floor);

const WORMS = 46;
const worms = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.05, 1, 6), new THREE.MeshStandardMaterial({ color: '#efe6d8', roughness: 0.6 }), WORMS);
const wormTips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: '#ff3d3d', emissive: '#c4141a', emissiveIntensity: 1.6 }), WORMS);
for (let i = 0; i < WORMS; i++) {
  const cx = (i < 30 ? 12 : 19) + (Math.random() - 0.5) * 4, cz = -16 + (Math.random() - 0.5) * 4;
  const h = 0.6 + Math.random() * 1.2, base = FLOOR_Y + floorHeight(cx, cz - FLOOR_Z) - 0.1;
  dummy.position.set(cx, base + h / 2, cz); dummy.scale.set(1, h, 1);
  dummy.rotation.set((Math.random() - 0.5) * 0.25, 0, (Math.random() - 0.5) * 0.25); dummy.updateMatrix();
  worms.setMatrixAt(i, dummy.matrix);
  dummy.position.y = base + h; dummy.scale.set(1, 1, 1); dummy.updateMatrix();
  wormTips.setMatrixAt(i, dummy.matrix);
}
scene.add(worms, wormTips);

/* ---------------------------------------------------------------------
   Lumen-6 submersible
   --------------------------------------------------------------------- */
const AMBER = new THREE.Color('#ffb547');
const sub = new THREE.Group();
const subInner = new THREE.Group();
sub.add(subInner);
{
  const frameMat = new THREE.MeshStandardMaterial({ color: '#f29a2e', metalness: 0.55, roughness: 0.32 });
  const steel = new THREE.MeshStandardMaterial({ color: '#c5ccd2', metalness: 0.95, roughness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b252d', metalness: 0.6, roughness: 0.5 });
  const white = new THREE.MeshStandardMaterial({ color: '#4d5a63', metalness: 0.7, roughness: 0.35 });

  // Acrylic sphere
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 48), new THREE.MeshPhysicalMaterial({
    color: '#d9f8ff', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.45, ior: 1.49,
    transparent: true, opacity: 1, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4, specularIntensity: 1,
  }));
  subInner.add(dome);

  // Cabin interior: six seats in a ring around the pilot console
  const seatMat = new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), seatMat);
    seat.position.set(Math.cos(a) * 0.68, -0.42, Math.sin(a) * 0.68); seat.rotation.y = -a;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.32), seatMat);
    back.position.set(Math.cos(a) * 0.86, -0.22, Math.sin(a) * 0.86); back.rotation.y = -a;
    subInner.add(seat, back);
  }
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48), dark);
  deck.position.y = -0.5; subInner.add(deck);
  const pilotConsole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.5, 16), steel);
  pilotConsole.position.y = -0.25; subInner.add(pilotConsole);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ color: '#6ff3e8' }));
  screen.position.set(0, 0.02, 0.16); screen.rotation.x = -0.4; subInner.add(screen);
  const cabinLight = new THREE.PointLight('#ffb36b', 5, 3.2, 1.5);
  cabinLight.position.set(0, 0.35, 0); subInner.add(cabinLight);
  const cabinGlow = glowSprite('#ffb36b', 2.4, 0.35); subInner.add(cabinGlow);

  // Equator and meridian rings
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.075, 18, 120), frameMat);
  ring.rotation.x = Math.PI / 2; subInner.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.045, 14, 120, Math.PI), frameMat);
  ring2.rotation.z = Math.PI; ring2.position.y = 0; subInner.add(ring2);
  ring2.rotation.y = Math.PI / 2;
  // Bolts on equator ring
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), steel);
    b.position.set(Math.cos(a) * 1.31, 0, Math.sin(a) * 1.31); subInner.add(b);
  }
  // Top hatch + strobe
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.14, 32), frameMat);
  hatch.position.y = 1.2; subInner.add(hatch);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), steel);
  mast.position.set(0.18, 1.42, 0); subInner.add(mast);
  const strobe = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff5b4a' }));
  strobe.position.set(0.18, 1.62, 0); subInner.add(strobe);
  const strobeGlow = glowSprite('#ff5b4a', 0.9, 0); strobeGlow.position.copy(strobe.position); subInner.add(strobeGlow);
  sub.userData.strobe = strobeGlow;

  // Lower frame: battery pods + skids
  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.6, 8, 20), white);
    pod.rotation.x = Math.PI / 2; pod.position.set(s * 1.05, -0.95, 0); subInner.add(pod);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.12, 24), frameMat);
    stripe.rotation.x = Math.PI / 2; stripe.position.set(s * 1.05, -0.95, 0.5); subInner.add(stripe);
    const skid = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 2.1, 6, 12), steel);
    skid.rotation.x = Math.PI / 2; skid.position.set(s * 0.75, -1.42, 0); subInner.add(skid);
    for (const z of [-0.65, 0.65]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), steel);
      strut.position.set(s * 0.8, -1.08, z); strut.rotation.z = s * 0.35; subInner.add(strut);
    }
  }

  // Thrusters (ducted props)
  const props = [];
  const thrusterAt = [[1.55, 0.05, -0.55, 0], [-1.55, 0.05, -0.55, 0], [1.45, -0.7, 0.6, 1], [-1.45, -0.7, 0.6, 1]];
  for (const [x, y, z, vertical] of thrusterAt) {
    const t = new THREE.Group();
    const duct = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 12, 32), dark);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 12), steel);
    hub.rotation.x = Math.PI / 2;
    const prop = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.02), steel);
      blade.position.y = 0.09; const holder = new THREE.Group(); holder.rotation.z = (b / 3) * Math.PI * 2; holder.add(blade); prop.add(holder);
    }
    t.add(duct, hub, prop);
    t.position.set(x, y, z);
    if (vertical) t.rotation.x = Math.PI / 2;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), frameMat);
    arm.position.set(x * 0.82, y, z); arm.rotation.z = Math.PI / 2;
    subInner.add(t, arm);
    props.push(prop);
  }
  sub.userData.props = props;

  // Floodlights: lamp heads, flares, volumetric beams and a real spotlight
  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uIntensity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uIntensity; uniform float uTime;
      void main(){
        float along = pow(vUv.y, 1.6);
        float soft = pow(abs(dot(vN, vV)), 1.4);
        float dust = 0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 2.0);
        float a = along * soft * dust * uIntensity * 0.32;
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a, a);
      }`,
  });
  const beams = [], flares = [];
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16), dark);
    lamp.rotation.x = Math.PI / 2 - 0.35; lamp.position.set(s * 0.62, -0.78, 1.0);
    const flare = glowSprite('#fff1d6', 0.7, 0); flare.position.set(s * 0.62, -0.8, 1.1);
    const beamGeo = new THREE.CylinderGeometry(0.08, 2.6, 9, 32, 1, true);
    beamGeo.translate(0, -4.5, 0);
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.copy(flare.position);
    beam.rotation.x = -Math.PI / 2 - 0.35; beam.rotation.z = s * 0.25;
    subInner.add(lamp, flare, beam);
    beams.push(beam); flares.push(flare);
  }
  const spot = new THREE.SpotLight('#fff0d0', 0, 34, 0.55, 0.6, 1.1);
  spot.position.set(0, -0.8, 1.1);
  spot.target.position.set(0, -4, 10);
  subInner.add(spot, spot.target);
  sub.userData = { ...sub.userData, beams, flares, beamMat, spot, cabinLight, cabinGlow, screen };
}
sub.scale.setScalar(1.2);
scene.add(sub);

/* ---------------------------------------------------------------------
   Post-processing (bloom) on capable devices
   --------------------------------------------------------------------- */
let composer = null, bloom = null;
if (!LOW_POWER) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.5, 0.82);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
}

/* ---------------------------------------------------------------------
   Scroll → depth mapping (piecewise between sections' data-depth)
   --------------------------------------------------------------------- */
const SUB_POSES = {
  hero: { x: 4.4, y: -0.4, z: 0, s: 1.25 },
  vessel: { x: 4.2, y: 0.2, z: 2.6, s: 1.35 },
  zones: { x: 6.2, y: 2.6, z: -4, s: 1.0 },
  expeditions: { x: 7.5, y: 3.4, z: -8, s: 0.9 },
  log: { x: 4.6, y: -0.6, z: 0, s: 1.15 },
  film: { x: 8, y: 3.8, z: -10, s: 0.85 },
  book: { x: 6.2, y: 1.4, z: -3, s: 1.0 },
  faq: { x: 4.6, y: 0.4, z: 0, s: 1.1 },
  floor: { x: 7.2, y: -0.6, z: -3, s: 1.0 },
};
let anchors = [];
function computeAnchors() {
  const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  anchors = $$('[data-depth]').map((el) => ({
    y: clamp(el.getBoundingClientRect().top + scrollY - innerHeight * 0.3, 0, max),
    d: +el.dataset.depth,
    pose: SUB_POSES[el.id] || SUB_POSES.hero,
  }));
  anchors[0].y = 0;
  anchors[anchors.length - 1].y = max;
  for (let i = 1; i < anchors.length; i++) anchors[i].y = Math.max(anchors[i].y, anchors[i - 1].y + 1);
}
function sampleScroll(y) {
  let i = 0;
  while (i < anchors.length - 2 && y > anchors[i + 1].y) i++;
  const a = anchors[i], b = anchors[i + 1];
  const t = clamp((y - a.y) / (b.y - a.y), 0, 1);
  const e = t * t * (3 - 2 * t);
  return {
    depth: lerp(a.d, b.d, t),
    pose: { x: lerp(a.pose.x, b.pose.x, e), y: lerp(a.pose.y, b.pose.y, e), z: lerp(a.pose.z, b.pose.z, e), s: lerp(a.pose.s, b.pose.s, e) },
  };
}

/* ---------------------------------------------------------------------
   HUD (depth gauge)
   --------------------------------------------------------------------- */
const hud = { depth: $('#gDepth'), press: $('#gPress'), temp: $('#gTemp'), light: $('#gLight'), zone: $('#gZone'), fill: $('#gaugeFill') };
const TEMP = [[0, 24], [200, 18], [500, 9], [1000, 4.5], [2000, 2.6], [4000, 1.6]];
function tempAt(d) { for (let i = 0; i < TEMP.length - 1; i++) if (d <= TEMP[i + 1][0]) return lerp(TEMP[i][1], TEMP[i + 1][1], (d - TEMP[i][0]) / (TEMP[i + 1][0] - TEMP[i][0])); return 1.6; }
const zoneAt = (d) => d < 200 ? 'Sunlight zone' : d < 1000 ? 'Twilight zone' : d < 4000 ? 'Midnight zone' : 'Abyssal zone';
// Gauge track scale is non-linear so the shallow zones get room: 0, 200, 1000, 4000 m at 0, 22, 50, 100 %.
const GAUGE_MAP = [[0, 0], [200, 22], [1000, 50], [4000, 100]];
function gaugePct(d) { for (let i = 0; i < GAUGE_MAP.length - 1; i++) if (d <= GAUGE_MAP[i + 1][0]) return lerp(GAUGE_MAP[i][1], GAUGE_MAP[i + 1][1], (d - GAUGE_MAP[i][0]) / (GAUGE_MAP[i + 1][0] - GAUGE_MAP[i][0])); return 100; }
$$('.gauge-ticks li').forEach((li) => { li.style.top = gaugePct(+li.dataset.d) + '%'; });
let lastHudDepth = -1;
function updateHud(d) {
  const r = Math.round(d);
  if (r === lastHudDepth) return;
  lastHudDepth = r;
  hud.depth.textContent = r.toLocaleString('en-US');
  hud.press.textContent = (1 + d / 10.06).toFixed(1);
  hud.temp.textContent = tempAt(d).toFixed(1);
  const light = 100 * Math.exp(-d / 38);
  hud.light.textContent = light >= 1 ? light.toFixed(0) : light >= 0.001 ? light.toFixed(3) : '0';
  hud.zone.textContent = zoneAt(d);
  hud.fill.style.height = gaugePct(d) + '%';
}

/* ---------------------------------------------------------------------
   Resize, input
   --------------------------------------------------------------------- */
function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer?.setSize(innerWidth, innerHeight);
  bloom?.setSize(innerWidth, innerHeight);
  for (const p of [snow, plankton]) p.material.uniforms.uAspect.value = camera.aspect;
  computeAnchors();
}
addEventListener('resize', onResize);
addEventListener('pointermove', (e) => {
  state.mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
}, { passive: true });

/* ---------------------------------------------------------------------
   Frame loop
   --------------------------------------------------------------------- */
const clock = new THREE.Clock();
let camY = 0, subPos = new THREE.Vector3(4.4, -0.4, 0), subScale = 1.25, lightsLevel = 0, prevDepth = 0;
let running = true;
document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) { clock.getDelta(); requestAnimationFrame(frame); } });

function frame() {
  if (!running) return;
  const dt = Math.min(clock.getDelta(), window.__hadalMaxDt || 0.05);
  state.time += REDUCED ? dt * 0.3 : dt;
  const t = state.time;

  const s = sampleScroll(scrollY);
  state.targetDepth = s.depth;
  const k = 1 - Math.pow(REDUCED ? 0.0001 : 0.025, dt);
  state.depth = lerp(state.depth, state.targetDepth, k);
  state.velocity = lerp(state.velocity, (state.depth - prevDepth) / Math.max(dt, 0.001), 0.1);
  prevDepth = state.depth;
  const d = state.depth;
  state.smouse.lerp(state.mouse, 1 - Math.pow(0.02, dt));

  // Water colour, fog, light falloff with depth
  colorAtDepth(d, waterColor);
  scene.background.copy(waterColor);
  scene.fog.color.copy(waterColor);
  scene.fog.density = lerp(0.026, 0.045, smooth(0, 1500, d));
  const sunlight = Math.exp(-d / 170);
  hemi.intensity = 0.06 + 2.4 * sunlight;
  sun.intensity = 2.6 * sunlight;
  scene.environmentIntensity = 0.12 + 0.88 * sunlight;
  renderer.toneMappingExposure = lerp(1.05, 1.3, smooth(0, 1200, d));

  // Camera
  camY = -d / 10;
  const look = 1.5 * (1 - smooth(0, 160, d)) - 3.2 * smooth(3850, 4000, d);
  camera.position.set(state.smouse.x * 0.7, camY + state.smouse.y * 0.35, 12);
  camera.lookAt(state.smouse.x * 0.2, camY + look, 0);
  rim.position.set(-6, camY + 3, -4); rim.target.position.set(0, camY, 0);

  // Surface + rays
  surfaceMat.uniforms.uTime.value = t;
  surfaceMat.uniforms.uOpacity.value = 1 - smooth(60, 260, d);
  surface.visible = d < 280;
  rayMat.uniforms.uTime.value = t;
  rayMat.uniforms.uIntensity.value = 1 - smooth(30, 320, d);
  rays.visible = d < 340;

  // Particles
  for (const p of [snow, plankton]) {
    p.material.uniforms.uTime.value = t;
    p.material.uniforms.uCamY.value = camY;
    p.material.uniforms.uMouse.value.copy(state.smouse);
  }
  snow.material.uniforms.uAlpha.value = lerp(0.55, 0.35, smooth(0, 2000, d));
  plankton.material.uniforms.uAlpha.value = smooth(250, 900, d) * (state.lights === 'on' ? 0.55 : 1);

  // Life
  fish.visible = d < 420;
  if (fish.visible) updateFish(t);
  updateJellies(t, camY);
  siphonophore.visible = d > 350 && d < 1250;
  siphMat.uniforms.uTime.value = t;
  angler.visible = d > 3300;
  if (angler.visible) {
    angler.position.y = -372 + Math.sin(t * 0.8) * 0.4;
    angler.position.x = -6.5 + Math.sin(t * 0.3) * 0.8;
    const flick = 0.75 + 0.25 * Math.sin(t * 5.3) * Math.sin(t * 2.1);
    lure.material.opacity = flick; lureLight.intensity = 6 * flick;
  }
  floor.visible = wormTips.visible = worms.visible = d > 3000;

  // Submersible: follows the camera with inertia, banks on scroll velocity
  const narrow = camera.aspect < 0.9;
  const pose = s.pose;
  const tx = narrow ? pose.x * 0.18 : pose.x * clamp(camera.aspect / 1.78, 0.75, 1.15);
  const ty = narrow ? -2.8 + pose.y * 0.2 : pose.y;
  const target = new THREE.Vector3(tx + state.smouse.x * 0.35, camY + ty + Math.sin(t * 0.8) * 0.12, narrow ? -2 + pose.z * 0.3 : pose.z);
  subPos.lerp(target, 1 - Math.pow(0.08, dt));
  subScale = lerp(subScale, (narrow ? 0.8 : 1) * pose.s, 1 - Math.pow(0.08, dt));
  sub.position.copy(subPos);
  sub.scale.setScalar(subScale);
  const vel = clamp(state.velocity / 300, -1, 1);
  sub.rotation.x = lerp(sub.rotation.x, -vel * 0.35 + state.smouse.y * 0.12, 0.08);
  sub.rotation.z = lerp(sub.rotation.z, Math.sin(t * 0.6) * 0.04 - state.smouse.x * 0.08, 0.08);
  sub.rotation.y = lerp(sub.rotation.y, -0.55 + Math.sin(t * 0.25) * 0.35 + state.smouse.x * 0.5, 0.05);
  for (const p of sub.userData.props) p.rotation.z += dt * (8 + Math.abs(state.velocity) * 0.02);
  sub.userData.strobe.material.opacity = (t % 2.2) < 0.12 ? 1 : 0;

  // Floodlights: auto turns on below 250 m, or the visitor forces them
  const want = state.lights === 'on' ? 1 : state.lights === 'off' ? 0 : smooth(150, 380, d);
  lightsLevel = lerp(lightsLevel, want, 1 - Math.pow(0.02, dt));
  const U = sub.userData;
  U.beamMat.uniforms.uIntensity.value = lightsLevel;
  U.beamMat.uniforms.uTime.value = t;
  U.spot.intensity = lightsLevel * 60;
  for (const f of U.flares) f.material.opacity = lightsLevel;
  U.cabinLight.intensity = 3 + 4 * smooth(100, 900, d);
  U.cabinGlow.material.opacity = 0.15 + 0.35 * smooth(100, 900, d);

  updateHud(d);

  if (composer) {
    bloom.strength = lerp(0.25, 1.0, smooth(100, 1200, d));
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}

/* =====================================================================
   DOM: loader, intro, reveals, interactions
   ===================================================================== */
const gsap = window.gsap;
if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

// Split headings into words while keeping inline <em> styling
function splitWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'w'; w.textContent = part; frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return $$('.w', el);
}

function countUp(el, dur = 1.6) {
  const to = +el.dataset.to;
  if (!gsap || REDUCED) { el.textContent = to.toLocaleString('en-US'); return; }
  const o = { v: 0 };
  gsap.to(o, { v: to, duration: dur, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
}

function setupReveals() {
  if (!gsap || !window.ScrollTrigger || REDUCED) return;
  $$('.split').forEach((h) => {
    const words = splitWords(h);
    gsap.from(words, {
      yPercent: 110, rotateX: -70, opacity: 0, transformPerspective: 600, transformOrigin: '50% 100%',
      duration: 1.0, ease: 'expo.out', stagger: 0.035,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true },
    });
  });
  $$('.section-head .lede, .section-head .depth-tag, .lights-control').forEach((el) => {
    gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  [['.spec-grid', '.spec'], ['.cards', '.card'], ['.zone-table', '.zone-row'], ['.faq-list', 'details']].forEach(([wrap, item]) => {
    const w = $(wrap); if (!w) return;
    gsap.from($$(item, w), {
      y: 70, opacity: 0, rotateX: item === '.card' ? 18 : 0, transformPerspective: 900, duration: 1.1, ease: 'expo.out', stagger: 0.09,
      scrollTrigger: { trigger: w, start: 'top 85%', once: true },
    });
  });
  $$('.spec .count, .hero-stats .count').forEach((el) => {
    window.ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => countUp(el) });
  });
  gsap.from('.film-frame', { scale: 0.86, rotateX: 14, opacity: 0, transformPerspective: 1200, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.film-frame', start: 'top 85%', once: true } });
  gsap.from('.booker', { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.booker', start: 'top 88%', once: true } });
  gsap.from('.floor-title', { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.floor-title', start: 'top 90%', once: true } });
  // Marquee drifts with scroll as well as on its own
  gsap.to('.marquee', { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
}

function intro() {
  $('#gauge').classList.add('on');
  if (!gsap || REDUCED) return;
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero-title .word', { yPercent: 115, rotate: 4, duration: 1.4, stagger: 0.08 })
    .from('.hero .reveal-line', { y: 26, opacity: 0, duration: 1.1, stagger: 0.1 }, '-=1.05')
    .from('.nav', { y: -30, opacity: 0, duration: 1 }, '-=1.1')
    .from('.scroll-cue', { opacity: 0, duration: 0.8 }, '-=0.6');
  $$('.hero-stats .count').forEach((el) => countUp(el, 2.2));
}

// Loader: real readiness (fonts + first frame) with a minimum show time
(async function boot() {
  const pctEl = $('#loaderPct'), bar = $('#loaderBar');
  let shown = 0, target = 30;
  const tick = setInterval(() => {
    shown += (target - shown) * 0.12 + 0.3;
    shown = Math.min(shown, target);
    pctEl.textContent = Math.round(shown) + '%';
    bar.style.width = shown + '%';
  }, 30);
  computeAnchors();
  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch {}
  target = 75;
  requestAnimationFrame(frame);
  await new Promise((r) => setTimeout(r, REDUCED ? 100 : 900));
  target = 100;
  await new Promise((r) => setTimeout(r, REDUCED ? 50 : 500));
  clearInterval(tick);
  pctEl.textContent = '100%'; bar.style.width = '100%';
  $('#loader').classList.add('done');
  computeAnchors();
  setupReveals();
  intro();
  window.ScrollTrigger?.refresh();
  setTimeout(computeAnchors, 600);
})();

/* ---- nav state ---- */
const nav = $('#nav');
const navLinks = $$('.nav-links a');
function onScroll() {
  nav.classList.toggle('scrolled', scrollY > 40);
  let current = null;
  for (const sec of $$('main > section[id], main > footer[id]')) if (sec.getBoundingClientRect().top < innerHeight * 0.45) current = sec.id;
  navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---- custom cursor ---- */
const cursor = $('#cursor');
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() { cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22; cursor.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', (e) => { cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, summary, input, video')); });
}

/* ---- magnetic buttons + 3D tilt cards ---- */
if (!COARSE && !REDUCED) {
  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.setProperty('--mx', ((e.clientX - r.left - r.width / 2) * 0.25) + 'px');
      b.style.setProperty('--my', ((e.clientY - r.top - r.height / 2) * 0.35) + 'px');
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
  });
  $$('.tilt').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 12}deg) rotateY(${(px - 0.5) * 14}deg) translateZ(10px)`;
      c.style.setProperty('--gx', px * 100 + '%'); c.style.setProperty('--gy', py * 100 + '%');
    });
    c.addEventListener('pointerleave', () => { c.style.transform = ''; });
  });
}

/* ---- floodlight control ---- */
$$('.seg button').forEach((b) => b.addEventListener('click', () => {
  $$('.seg button').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
  state.lights = b.dataset.lights;
}));

/* ---- dive log carousel ---- */
(function logCarousel() {
  const entries = $$('.log-entry'), dotsWrap = $('#logDots');
  let i = 0, timer = null;
  const dots = entries.map((_, n) => {
    const d = document.createElement('button'); d.type = 'button'; d.setAttribute('aria-label', `Entry ${n + 1}`);
    d.addEventListener('click', () => go(n, true)); dotsWrap.appendChild(d); return d;
  });
  function go(n, user) {
    i = (n + entries.length) % entries.length;
    entries.forEach((e, k) => e.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => { d.removeAttribute('aria-current'); if (k === i) { void d.offsetWidth; d.setAttribute('aria-current', 'true'); } });
    clearInterval(timer); timer = setInterval(() => go(i + 1), 7000);
    if (user) ping(900);
  }
  $('#logPrev').addEventListener('click', () => go(i - 1, true));
  $('#logNext').addEventListener('click', () => go(i + 1, true));
  $('#logStage').addEventListener('pointerenter', () => clearInterval(timer));
  $('#logStage').addEventListener('pointerleave', () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 7000); });
  go(0);
})();

/* ---- film ---- */
(function film() {
  const v = $('#filmVideo'), btn = $('#filmPlay'), frame = $('.film-frame');
  const play = () => { if (audio && audio.on) setSound(false); v.muted = false; v.play().then(() => frame.classList.add('playing')).catch(() => { v.muted = true; v.play(); frame.classList.add('playing'); }); };
  btn.addEventListener('click', play);
  v.addEventListener('click', () => { if (v.paused) play(); else { v.pause(); frame.classList.remove('playing'); } });
  v.addEventListener('ended', () => { frame.classList.remove('playing'); v.currentTime = 0; });
  v.addEventListener('error', () => { $('.film-meta span:last-child').textContent = 'Film file not found · run the render in /video'; });
})();

/* ---- booking ---- */
(function booking() {
  const EXP = {
    drift: { name: 'The Twilight Drift', price: 4900, depth: '450 m', nights: 1 },
    fall: { name: 'Whale Fall', price: 11500, depth: '1,200 m', nights: 2 },
    wall: { name: 'The Wall', price: 38000, depth: '3,800 m', nights: 3 },
  };
  const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  const FULL = { Mar: 'March', Apr: 'April', May: 'May', Jun: 'June', Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October' };
  // Deterministic seat availability per expedition and month
  const seatsFor = (exp, m) => { const h = [...(exp + m)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7); return [0, 2, 6, 4, 1, 6, 3, 5, 6, 2][h % 10]; };
  const form = $('#booker'), monthsEl = $('#bkMonths');
  let guests = 2, month = null, shownPrice = 23000;

  const exp = () => form.querySelector('input[name="exp"]:checked').value;
  function renderMonths() {
    monthsEl.innerHTML = '';
    let firstOpen = null;
    MONTHS.forEach((m) => {
      const s = seatsFor(exp(), m);
      const b = document.createElement('button'); b.type = 'button'; b.dataset.m = m;
      b.innerHTML = `<b>${m} 2027</b><small class="${s && s <= 2 ? 'low' : ''}">${s === 0 ? 'Full' : s === 6 ? 'Open' : s + ' seats left'}</small>`;
      b.disabled = s === 0;
      b.setAttribute('aria-pressed', 'false');
      if (s && !firstOpen) firstOpen = m;
      b.addEventListener('click', () => { month = m; update(); });
      monthsEl.appendChild(b);
    });
    if (!month || seatsFor(exp(), month) === 0) month = firstOpen;
  }
  function update() {
    const e = EXP[exp()];
    const seats = seatsFor(exp(), month);
    $$('button', monthsEl).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === month)));
    if (guests > seats) guests = seats;
    $('#gCount').textContent = guests;
    $('#gMinus').disabled = guests <= 1;
    $('#gPlus').disabled = guests >= seats;
    $('#seatsNote').textContent = `· ${seats === 6 ? 'all 6 seats open' : seats + ' of 6 seats open'} in ${FULL[month]}`;
    const charter = guests === 6;
    const total = e.price * guests * (charter ? 0.9 : 1);
    $('#tGuests').textContent = guests + (guests === 1 ? ' guest' : ' guests');
    $('#tNote').textContent = `${charter ? 'Charter rate, 10% off. ' : ''}Includes ${e.nights} night${e.nights > 1 ? 's' : ''} aboard the support ship RV Kōlea.`;
    $('#charterHint').textContent = charter ? 'You have the whole sphere. Charter rate applied.' : seats === 6 ? 'Book all 6 seats to charter the sphere and save 10%.' : 'Charter needs a month with all 6 seats open.';
    const fmt = (v) => '$' + Math.round(v).toLocaleString('en-US');
    if (gsap && !REDUCED) { const o = { v: shownPrice }; gsap.to(o, { v: total, duration: 0.6, ease: 'power3.out', onUpdate: () => { $('#tPrice').textContent = fmt(o.v); } }); }
    else $('#tPrice').textContent = fmt(total);
    shownPrice = total;
  }
  form.addEventListener('change', (e) => { if (e.target.name === 'exp') { renderMonths(); update(); ping(1100); } });
  $('#gMinus').addEventListener('click', () => { guests = Math.max(1, guests - 1); update(); });
  $('#gPlus').addEventListener('click', () => { guests = Math.min(6, guests + 1); update(); });
  $$('[data-pick]').forEach((a) => a.addEventListener('click', () => { $('#exp-' + a.dataset.pick).checked = true; renderMonths(); update(); }));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = $('#bkName'), email = $('#bkEmail'), err = $('#bkErr');
    name.removeAttribute('aria-invalid'); email.removeAttribute('aria-invalid');
    if (!name.value.trim()) { err.textContent = 'Add the name that will go on the dive manifest.'; name.setAttribute('aria-invalid', 'true'); name.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { err.textContent = 'That email looks incomplete. Check for the @ and the domain.'; email.setAttribute('aria-invalid', 'true'); email.focus(); return; }
    err.textContent = '';
    const e = EXP[exp()];
    const code = 'HDL-27-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    $('#cTitle').textContent = `See you at ${e.depth}.`;
    $('#cBody').textContent = `${name.value.trim().split(' ')[0]}, we're holding ${guests} seat${guests > 1 ? 's' : ''} on ${e.name} in ${FULL[month]} 2027. HADAL is a concept brand, so no email goes out and nothing is charged.`;
    $('#cCode').textContent = code;
    form.hidden = true; $('#confirm').hidden = false;
    ping(700); setTimeout(() => ping(700), 380);
    if (gsap && !REDUCED) gsap.from('#confirm', { y: 40, opacity: 0, scale: 0.96, duration: 0.9, ease: 'expo.out' });
  });
  $('#cAgain').addEventListener('click', () => { $('#confirm').hidden = true; form.hidden = false; });

  renderMonths(); update();
})();

/* ---- ascend back to the surface ---- */
$('#ascend').addEventListener('click', () => {
  const start = scrollY, dur = REDUCED ? 1 : 2600, t0 = performance.now();
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  ping(500);
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    scrollTo(0, start * (1 - ease(p)));
    if (p < 1) requestAnimationFrame(step);
  })(t0);
});

/* =====================================================================
   Sound: synthesised in the browser. Brown-noise swell, low drone,
   sonar pings. The filter closes as you go deeper.
   ===================================================================== */
let audio = null;
function buildAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; data[i] = last * 3.2; }
  }
  const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.7;
  const nGain = ctx.createGain(); nGain.gain.value = 0.55;
  noise.connect(lp).connect(nGain).connect(master); noise.start();
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain(); lfo.frequency.value = 0.07; lfoGain.gain.value = 220;
  lfo.connect(lfoGain).connect(lp.frequency); lfo.start();
  const drone = ctx.createGain(); drone.gain.value = 0.09; drone.connect(master);
  const oscs = [55, 55.35, 82.4].map((f, i) => { const o = ctx.createOscillator(); o.type = i === 2 ? 'triangle' : 'sine'; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = i === 2 ? 0.25 : 1; o.connect(g).connect(drone); o.start(); return o; });
  const delay = ctx.createDelay(2); delay.delayTime.value = 0.48;
  const fb = ctx.createGain(); fb.gain.value = 0.42;
  const wet = ctx.createBiquadFilter(); wet.type = 'lowpass'; wet.frequency.value = 2400;
  delay.connect(fb).connect(wet).connect(delay); delay.connect(master);
  return { ctx, master, lp, oscs, delay, on: false, timer: null };
}
function ping(freq = 1250, vol = 0.18) {
  if (!audio || !audio.on) return;
  const { ctx, master, delay } = audio; const now = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine';
  o.frequency.setValueAtTime(freq, now); o.frequency.exponentialRampToValueAtTime(freq * 0.97, now + 1.2);
  g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(vol, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  o.connect(g); g.connect(master); g.connect(delay); o.start(now); o.stop(now + 1.5);
}
function setSound(on) {
  if (!audio) audio = buildAudio();
  audio.on = on;
  audio.ctx.resume();
  audio.master.gain.cancelScheduledValues(audio.ctx.currentTime);
  audio.master.gain.setTargetAtTime(on ? 0.5 : 0, audio.ctx.currentTime, 0.4);
  clearInterval(audio.timer);
  if (on) { ping(); audio.timer = setInterval(() => ping(1250 - Math.min(state.depth, 4000) * 0.12), 6500); }
  const btn = $('#soundBtn');
  btn.setAttribute('aria-pressed', String(on));
  $('.sound-label', btn).textContent = on ? 'Sound on' : 'Sound off';
}
$('#soundBtn').addEventListener('click', () => setSound(!(audio && audio.on)));
setInterval(() => {
  if (!audio || !audio.on) return;
  const now = audio.ctx.currentTime, d = state.depth;
  audio.lp.frequency.setTargetAtTime(Math.max(160, 760 - d * 0.16), now, 0.5);
  audio.oscs[0].frequency.setTargetAtTime(55 - d * 0.003, now, 0.5);
  audio.oscs[1].frequency.setTargetAtTime(55.35 - d * 0.003, now, 0.5);
}, 250);
