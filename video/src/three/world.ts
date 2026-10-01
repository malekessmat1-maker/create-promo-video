import * as THREE from 'three';

/*
 * The HADAL ocean, ported from the website (site/main.js) so the film and the site
 * share one visual world. Every random value comes from a seeded generator, because
 * Remotion renders frames in parallel tabs and each tab must build an identical scene.
 * World units: 1 unit = 10 m of depth.
 */

export const mulberry32 = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const COLOR_STOPS: [number, THREE.Color][] = (
  [[0, '#1b8ba0'], [80, '#126f8c'], [200, '#0a4565'], [600, '#06263d'], [1000, '#03121f'], [2500, '#020a14'], [4000, '#01060c']] as [number, string][]
).map(([d, c]) => [d, new THREE.Color(c)]);

export function waterColorAt(depthM: number, out: THREE.Color) {
  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    const [d0, c0] = COLOR_STOPS[i]; const [d1, c1] = COLOR_STOPS[i + 1];
    if (depthM <= d1) return out.copy(c0).lerp(c1, Math.min(1, Math.max(0, (depthM - d0) / (d1 - d0))));
  }
  return out.copy(COLOR_STOPS[COLOR_STOPS.length - 1][1]);
}

let glowTex: THREE.Texture | null = null;
function glowTexture() {
  if (glowTex) return glowTex;
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const d = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2);
    const a = Math.max(0, 1 - d);
    const v = Math.pow(a, 2.2) * 0.75 + (d < 0.25 ? (1 - d / 0.25) * 0.25 : 0);
    const i = (y * size + x) * 4; data[i] = data[i + 1] = data[i + 2] = 255; data[i + 3] = Math.min(255, v * 255);
  }
  glowTex = new THREE.DataTexture(data, size, size); glowTex.needsUpdate = true;
  return glowTex;
}
export const glowSprite = (color: string, size: number, opacity = 1) => {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.setScalar(size); return s;
};

/* ---------------- Surface (caustics, Snell's window) ---------------- */
export function createSurface() {
  const mat = new THREE.ShaderMaterial({
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
        vec3 col = mix(vec3(0.10,0.55,0.66), vec3(0.75,1.0,1.0), clamp(k*0.9 + snell*0.9, 0., 1.));
        float a = (0.08 + k*0.45 + snell*0.5) * smoothstep(0.5, 0.1, r) * uOpacity;
        gl_FragColor = vec4(col, a);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), mat);
  mesh.rotation.x = Math.PI / 2; mesh.position.set(0, 7.5, -10);
  return { mesh, mat };
}

export function createRays(rand: () => number) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
    vertexShader: `varying vec2 vUv; varying float vSeed; attribute float aSeed; void main(){ vUv = uv; vSeed = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: `
      varying vec2 vUv; varying float vSeed; uniform float uTime; uniform float uIntensity;
      void main(){
        float edge = smoothstep(0.0, 0.5, vUv.x) * smoothstep(1.0, 0.5, vUv.x);
        float a = edge * pow(vUv.y, 2.2) * (0.55 + 0.45 * sin(uTime * 0.6 + vSeed * 12.0)) * uIntensity * 0.16;
        gl_FragColor = vec4(vec3(0.75, 0.97, 1.0) * a, a);
      }`,
  });
  const group = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const w = 1.2 + rand() * 3.2, h = 70;
    const geo = new THREE.PlaneGeometry(w, h);
    geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(new Array(4).fill(rand()), 1));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(-22 + rand() * 44, 7.5 - h / 2, -24 + rand() * 22);
    m.rotation.set(0, (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.35 + 0.12);
    group.add(m);
  }
  return { group, mat };
}

/* ---------------- Particles: marine snow + plankton ---------------- */
export function createParticles(rand: () => number, opts: { count: number; colors: string[]; size: number; deep: boolean; spread?: [number, number, number] }) {
  const spread = opts.spread ?? [44, 60, 40];
  const pos = new Float32Array(opts.count * 3), seed = new Float32Array(opts.count), col = new Float32Array(opts.count * 3);
  const palette = opts.colors.map((c) => new THREE.Color(c));
  for (let i = 0; i < opts.count; i++) {
    pos[i * 3] = (rand() - 0.5) * spread[0];
    pos[i * 3 + 1] = rand() * spread[1];
    pos[i * 3 + 2] = -spread[2] * 0.75 + rand() * spread[2];
    seed[i] = rand();
    const c = palette[Math.floor(rand() * palette.length)];
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uCamY: { value: 0 }, uH: { value: spread[1] }, uSize: { value: opts.size }, uPixel: { value: 1 }, uAlpha: { value: 1 }, uDeep: { value: opts.deep ? 1 : 0 }, uCenter: { value: new THREE.Vector3() } },
    vertexShader: `
      attribute float aSeed; attribute vec3 aColor;
      uniform float uTime, uCamY, uH, uSize, uPixel, uDeep;
      varying float vA; varying vec3 vCol;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime * (0.08 + aSeed * 0.25) - uCamY + uH * 0.5, uH) + uCamY - uH * 0.5;
        p.x += sin(uTime * 0.35 + aSeed * 40.0) * 0.4;
        p.z += cos(uTime * 0.25 + aSeed * 30.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float twinkle = uDeep > 0.5 ? (0.3 + 0.7 * pow(0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 3.0) + aSeed * 50.0), 3.0)) : 1.0;
        gl_PointSize = uSize * (0.35 + aSeed) * uPixel * (30.0 / -mv.z);
        vA = exp(-pow(-mv.z * 0.035, 2.0)) * twinkle;
        vCol = aColor;
      }`,
    fragmentShader: `
      uniform float uAlpha; varying float vA; varying vec3 vCol;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float s = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vCol, min(1.0, s * s * vA * uAlpha));
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return { points, mat };
}

/* ---------------- Jellyfish ---------------- */
const bellGeo = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
export function createJelly(rand: () => number, color: string) {
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uPhase: { value: rand() * 6.28 }, uColor: { value: new THREE.Color(color) }, uGlow: { value: 1 } },
    vertexShader: `
      uniform float uTime, uPhase; varying vec3 vN; varying vec3 vV; varying float vY; varying vec2 vUv; varying float vDist;
      void main(){
        vec3 p = position; float pulse = sin(uTime * 1.7 + uPhase); float rim = 1.0 - p.y;
        p.xz *= 1.0 - 0.17 * pulse * rim; p.y *= 0.72 + 0.1 * pulse;
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
        float a = (0.08 + fres * 0.95 + ribs * 0.5 + rimGlow) * uGlow * exp(-pow(vDist * 0.03, 2.0));
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  group.add(new THREE.Mesh(bellGeo, mat));
  const core = glowSprite(color, 2.4, 0.4); core.position.y = 0.3; group.add(core);
  const SEG = 22;
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const tentacles = Array.from({ length: 9 }, (_, k) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG * 3), 3));
    const line = new THREE.Line(g, lineMat); line.frustumCulled = false; group.add(line);
    const arm = k < 3;
    return { line, theta: (k / 9) * Math.PI * 2, len: arm ? 2.2 : 3.4 + rand() * 2, r: arm ? 0.18 : 0.88, arm };
  });
  const phase = mat.uniforms.uPhase.value as number;
  const update = (t: number, glow: number) => {
    mat.uniforms.uTime.value = t; mat.uniforms.uGlow.value = glow;
    const pulse = Math.sin(t * 1.7 + phase);
    core.material.opacity = (0.25 + 0.2 * (0.5 + 0.5 * pulse)) * glow;
    lineMat.opacity = 0.55 * glow;
    for (const tn of tentacles) {
      const arr = tn.line.geometry.attributes.position.array as Float32Array;
      const squeeze = 1 - 0.17 * pulse;
      const bx = Math.cos(tn.theta) * tn.r * squeeze, bz = Math.sin(tn.theta) * tn.r * squeeze;
      for (let s = 0; s < SEG; s++) {
        const k = s / (SEG - 1);
        const sway = Math.sin(t * 1.3 - k * 4 + tn.theta * 2 + phase) * 0.35 * k;
        const curl = tn.arm ? Math.sin(t * 0.9 + k * 6 + tn.theta) * 0.15 * k : 0;
        arr[s * 3] = bx * (1 - k * 0.3) + sway + curl;
        arr[s * 3 + 1] = -k * tn.len - (1 - squeeze) * 0.6 * k;
        arr[s * 3 + 2] = bz * (1 - k * 0.3) + Math.cos(t * 1.1 - k * 3 + tn.theta) * 0.25 * k;
      }
      tn.line.geometry.attributes.position.needsUpdate = true;
    }
  };
  return { group, update, phase };
}

/* ---------------- Lumen-6 submersible ---------------- */
export function createSub() {
  const sub = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: '#f29a2e', metalness: 0.55, roughness: 0.32 });
  const steel = new THREE.MeshStandardMaterial({ color: '#c5ccd2', metalness: 0.95, roughness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: '#1b252d', metalness: 0.6, roughness: 0.5 });
  const pods = new THREE.MeshStandardMaterial({ color: '#4d5a63', metalness: 0.7, roughness: 0.35 });

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 48), new THREE.MeshPhysicalMaterial({
    color: '#d9f8ff', metalness: 0, roughness: 0.03, transmission: 1, thickness: 0.45, ior: 1.49,
    transparent: true, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4,
  }));
  sub.add(dome);

  const seatMat = new THREE.MeshStandardMaterial({ color: '#3a2a22', roughness: 0.7 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.34), seatMat);
    seat.position.set(Math.cos(a) * 0.68, -0.42, Math.sin(a) * 0.68); seat.rotation.y = -a;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.4, 0.32), seatMat);
    back.position.set(Math.cos(a) * 0.86, -0.22, Math.sin(a) * 0.86); back.rotation.y = -a;
    sub.add(seat, back);
  }
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.05, 48), dark); deck.position.y = -0.5; sub.add(deck);
  const pilotConsole = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.5, 16), steel); pilotConsole.position.y = -0.25; sub.add(pilotConsole);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.14), new THREE.MeshBasicMaterial({ color: '#6ff3e8' }));
  screen.position.set(0, 0.02, 0.16); screen.rotation.x = -0.4; sub.add(screen);
  const cabinLight = new THREE.PointLight('#ffb36b', 6, 3.2, 1.5); cabinLight.position.set(0, 0.35, 0); sub.add(cabinLight);
  const cabinGlow = glowSprite('#ffb36b', 2.6, 0.4); sub.add(cabinGlow);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.24, 0.075, 18, 120), frameMat); ring.rotation.x = Math.PI / 2; sub.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.045, 14, 120, Math.PI), frameMat); ring2.rotation.set(0, Math.PI / 2, Math.PI); sub.add(ring2);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), steel); b.position.set(Math.cos(a) * 1.31, 0, Math.sin(a) * 1.31); sub.add(b);
  }
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.14, 32), frameMat); hatch.position.y = 1.2; sub.add(hatch);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 8), steel); mast.position.set(0.18, 1.42, 0); sub.add(mast);
  const strobe = glowSprite('#ff5b4a', 0.9, 0); strobe.position.set(0.18, 1.62, 0); sub.add(strobe);
  const strobeBulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), new THREE.MeshBasicMaterial({ color: '#ff5b4a' })); strobeBulb.position.copy(strobe.position); sub.add(strobeBulb);

  for (const s of [-1, 1]) {
    const pod = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 1.6, 8, 20), pods); pod.rotation.x = Math.PI / 2; pod.position.set(s * 1.05, -0.95, 0); sub.add(pod);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.12, 24), frameMat); stripe.rotation.x = Math.PI / 2; stripe.position.set(s * 1.05, -0.95, 0.5); sub.add(stripe);
    const skid = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 2.1, 6, 12), steel); skid.rotation.x = Math.PI / 2; skid.position.set(s * 0.75, -1.42, 0); sub.add(skid);
    for (const z of [-0.65, 0.65]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 8), steel); strut.position.set(s * 0.8, -1.08, z); strut.rotation.z = s * 0.35; sub.add(strut);
    }
  }
  const props: THREE.Group[] = [];
  for (const [x, y, z, vertical] of [[1.55, 0.05, -0.55, 0], [-1.55, 0.05, -0.55, 0], [1.45, -0.7, 0.6, 1], [-1.45, -0.7, 0.6, 1]]) {
    const t = new THREE.Group();
    const duct = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.055, 12, 32), dark);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 12), steel); hub.rotation.x = Math.PI / 2;
    const prop = new THREE.Group();
    for (let b = 0; b < 3; b++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.18, 0.02), steel); blade.position.y = 0.09;
      const holder = new THREE.Group(); holder.rotation.z = (b / 3) * Math.PI * 2; holder.add(blade); prop.add(holder);
    }
    t.add(duct, hub, prop); t.position.set(x, y, z); if (vertical) t.rotation.x = Math.PI / 2;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), frameMat); arm.position.set(x * 0.82, y, z); arm.rotation.z = Math.PI / 2;
    sub.add(t, arm); props.push(prop);
  }

  const beamMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uIntensity: { value: 0 }, uTime: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; uniform float uIntensity; uniform float uTime;
      void main(){
        float a = pow(vUv.y, 1.6) * pow(abs(dot(vN, vV)), 1.4) * (0.85 + 0.15 * sin(vUv.y * 40.0 - uTime * 2.0)) * uIntensity * 0.4;
        gl_FragColor = vec4(vec3(1.0, 0.93, 0.78) * a, a);
      }`,
  });
  const flares: THREE.Sprite[] = [];
  for (const s of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.16, 16), dark); lamp.rotation.x = Math.PI / 2 - 0.35; lamp.position.set(s * 0.62, -0.78, 1.0);
    const flare = glowSprite('#fff1d6', 0.8, 0); flare.position.set(s * 0.62, -0.8, 1.1);
    const beamGeo = new THREE.CylinderGeometry(0.08, 2.8, 11, 32, 1, true); beamGeo.translate(0, -5.5, 0);
    const beam = new THREE.Mesh(beamGeo, beamMat); beam.position.copy(flare.position); beam.rotation.x = -Math.PI / 2 - 0.3; beam.rotation.z = s * 0.25;
    sub.add(lamp, flare, beam); flares.push(flare);
  }
  const spot = new THREE.SpotLight('#fff0d0', 0, 40, 0.6, 0.6, 1.1); spot.position.set(0, -0.8, 1.1); spot.target.position.set(0, -4, 10);
  sub.add(spot, spot.target);

  const update = (t: number, lights: number, cabin: number) => {
    for (const p of props) p.rotation.z = t * 9;
    beamMat.uniforms.uIntensity.value = lights; beamMat.uniforms.uTime.value = t;
    spot.intensity = lights * 70;
    for (const f of flares) f.material.opacity = lights;
    cabinLight.intensity = 6 * cabin; cabinGlow.material.opacity = 0.4 * cabin;
    strobe.material.opacity = (t % 2.2) < 0.12 ? 1 : 0;
  };
  return { group: sub, update };
}
