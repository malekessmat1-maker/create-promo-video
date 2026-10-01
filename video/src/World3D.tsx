import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo } from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { F, lightsAt, glowBoostAt } from './timeline';
import { createJelly, createParticles, createRays, createSub, createSurface, mulberry32, waterColorAt } from './three/world';

const SUB = new THREE.Vector3(0, -100, 0); // Lumen-6 waits at 1,000 m

/* Camera keyframes after the descent, relative to the sub: [frame, position, lookAt] */
const KEYS: [number, [number, number, number], [number, number, number]][] = [
  [F.descentEnd, [0, 1.5, 10], [0, 0.5, 0]],
  [262, [3.6, 1.0, 7.4], [0, 0, 0]],
  [F.revealEnd, [5.0, 0.6, 2.8], [0, 0, 0]],
  [F.f1End, [2.5, 0.9, 2.1], [0, 0.15, 0]],
  [F.f2End, [-2.6, -1.4, 8.2], [0, 0.2, 0]],
  [F.f3End, [-5.6, 0.4, 6.6], [0, 0, 0]],
  [540, [-2.2, 1.4, 9.4], [0, -0.2, 0]],
  [F.end, [0.4, 2.2, 12.5], [0, -0.8, 0]],
];
const posCurve = new THREE.CatmullRomCurve3(KEYS.map(([, p]) => new THREE.Vector3(...p)), false, 'centripetal');
const lookCurve = new THREE.CatmullRomCurve3(KEYS.map(([, , l]) => new THREE.Vector3(...l)), false, 'centripetal');
function keyParam(frame: number) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [f0] = KEYS[i]; const [f1] = KEYS[i + 1];
    if (frame <= f1) return (i + Math.max(0, (frame - f0) / (f1 - f0))) / (KEYS.length - 1);
  }
  return 1;
}

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const smooth = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

function buildWorld(portrait: boolean) {
  const rand = mulberry32(2027);
  const root = new THREE.Group();
  const surface = createSurface();
  const rays = createRays(rand);
  const snow = createParticles(rand, { count: 3200, colors: ['#d8eef0'], size: 1.7, deep: false });
  const plankton = createParticles(rand, { count: 2600, colors: ['#72f2e4', '#5ad1ff', '#8a6cf0', '#9dfff0'], size: 3.4, deep: true });
  const sub = createSub();
  sub.group.position.copy(SUB);
  sub.group.scale.setScalar(portrait ? 1.0 : 1.1);
  const jellyDefs: [number, number, number, number, string][] = [
    [-5, -30, -6, 1.2, '#72f2e4'], [6, -48, -9, 1.5, '#b08cff'], [-6.5, -66, -5, 1.0, '#ff8ad8'], [5, -82, -7, 1.1, '#7fc8ff'],
    [-5.2, -98.4, -6.5, 0.9, '#72f2e4'], [5.4, -96.8, -7.5, 1.2, '#b08cff'], [-7.5, -102, -10, 1.4, '#ff8ad8'],
    [7.4, -101.6, -4, 0.8, '#ffd27a'], [1.8, -95.4, -11, 1.3, '#7fc8ff'], [-3.4, -96.2, -7, 0.7, '#b08cff'],
  ];
  const jellies = jellyDefs.map(([x, y, z, s, c]) => {
    const j = createJelly(rand, c);
    j.group.position.set(x, y, z); j.group.scale.setScalar(s); j.group.rotation.z = (rand() - 0.5) * 0.4;
    root.add(j.group);
    return { ...j, baseY: y };
  });
  const hemi = new THREE.HemisphereLight('#c9f7ff', '#05283a', 2.4);
  const sun = new THREE.DirectionalLight('#e6fbff', 2.6); sun.position.set(-4, 20, 6);
  const key = new THREE.DirectionalLight('#ffd9a8', 0); key.position.set(-6, -94, 8); key.target.position.copy(SUB);
  const rim = new THREE.DirectionalLight('#62e6ff', 1.6); rim.position.set(6, -96, -8); rim.target.position.copy(SUB);
  root.add(surface.mesh, rays.group, snow.points, plankton.points, sub.group, hemi, sun, key, key.target, rim, rim.target);
  return { root, surface, rays, snow, plankton, sub, jellies, hemi, sun, key };
}

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const portrait = height > width;
  const { camera, scene, gl } = useThree();
  const world = useMemo(() => buildWorld(portrait), [portrait]);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.background = new THREE.Color('#1b8ba0');
    scene.fog = new THREE.FogExp2('#1b8ba0', 0.03);
    scene.add(world.root);
    return () => { scene.remove(world.root); };
  }, [scene, gl, world]);

  const t = frame / fps;
  const cam = camera as THREE.PerspectiveCamera;
  const distScale = portrait ? 1.45 : 1;
  cam.fov = portrait ? 62 : 48;
  cam.near = 0.1; cam.far = 300;

  // ---- camera ----
  const look = new THREE.Vector3();
  if (frame < F.descentEnd) {
    const e = ease(Math.min(1, Math.max(0, (frame - F.hookEnd) / (F.descentEnd - F.hookEnd))));
    const drift = Math.max(0, F.hookEnd - frame) * 0.004;
    const camY = 2 + drift + (SUB.y + 1.5 - 2) * e;
    const z = 10 * (1 + (distScale - 1) * e);
    cam.position.set(Math.sin(t * 0.7) * 0.4 * (1 - e), camY, z);
    const up = 4.2 * (1 - smooth(0, 0.45, e));
    look.set(0, camY + up - 1.0 * smooth(0.45, 1, e), 0);
    cam.lookAt(look);
    cam.rotateZ(Math.sin(e * Math.PI) * 0.12);
  } else {
    const u = keyParam(frame);
    const p = posCurve.getPoint(u).multiplyScalar(distScale);
    cam.position.copy(SUB).add(p);
    look.copy(SUB).add(lookCurve.getPoint(u));
    // Frame the sub away from the copy: to the right in landscape, upper half in portrait.
    const frameIt = smooth(F.descentEnd, F.descentEnd + 45, frame) * (1 - smooth(F.f3End, F.f3End + 40, frame));
    const right = cam.position.clone().sub(look).cross(new THREE.Vector3(0, 1, 0)).normalize();
    if (portrait) look.y -= 1.7 * frameIt; else look.addScaledVector(right, 2.7 * frameIt);
    cam.position.y += Math.sin(t * 0.8) * 0.06;
    cam.lookAt(look);
  }
  cam.updateProjectionMatrix();

  // ---- water, light, fog by camera depth ----
  const depth = Math.max(0, -cam.position.y * 10);
  const water = waterColorAt(depth, new THREE.Color());
  (scene.background as THREE.Color | null)?.copy?.(water);
  if (scene.fog) (scene.fog as THREE.FogExp2).color.copy(water);
  if (scene.fog) (scene.fog as THREE.FogExp2).density = 0.026 + 0.016 * smooth(0, 1000, depth);
  const sunlight = Math.exp(-depth / 170);
  world.hemi.intensity = 0.08 + 2.4 * sunlight;
  world.sun.intensity = 2.6 * sunlight;
  world.key.intensity = 1.1 * smooth(600, 950, depth);
  scene.environmentIntensity = 0.16 + 0.84 * sunlight;
  gl.toneMappingExposure = 1.05 + 0.3 * smooth(0, 1000, depth);

  world.surface.mat.uniforms.uTime.value = t;
  world.surface.mat.uniforms.uOpacity.value = 1 - smooth(60, 260, depth);
  world.rays.mat.uniforms.uTime.value = t;
  world.rays.mat.uniforms.uIntensity.value = 1 - smooth(30, 320, depth);

  const boost = glowBoostAt(frame);
  for (const p of [world.snow, world.plankton]) {
    p.mat.uniforms.uTime.value = t;
    p.mat.uniforms.uCamY.value = cam.position.y;
    p.mat.uniforms.uPixel.value = Math.min(width, height) / 1080 * 1.4;
  }
  world.snow.mat.uniforms.uAlpha.value = 0.55;
  world.plankton.mat.uniforms.uAlpha.value = smooth(200, 800, depth) * (0.7 + 1.6 * boost);
  world.plankton.mat.uniforms.uSize.value = 3.4 * (1 + 0.6 * boost);

  for (const j of world.jellies) {
    j.group.position.y = j.baseY + Math.sin(t * 0.35 + j.phase) * 0.6;
    j.group.rotation.y = t * 0.1 + j.phase;
    j.update(t, 0.7 + 1.1 * boost);
  }

  // ---- the sub ----
  const lights = lightsAt(frame);
  const sink = smooth(F.f3End, F.end, frame) * -1.6;
  world.sub.group.position.set(SUB.x, SUB.y + sink + Math.sin(t * 0.9) * 0.08, SUB.z);
  world.sub.group.rotation.set(Math.sin(t * 0.7) * 0.03, -0.35 + t * 0.05, Math.sin(t * 0.6) * 0.04);
  world.sub.update(t, lights, 0.35 + 0.65 * smooth(F.descentEnd - 30, F.descentEnd + 10, frame));

  return null;
};

export const World3D: React.FC = () => <Scene />;
