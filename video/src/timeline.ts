/* Frame timeline at 30 fps (600 frames = 20 s). The soundtrack cue sheet in
   scripts/soundtrack.py is written against these same frames. */
export const FPS = 30;
export const F = {
  hookEnd: 78, // 2.6 s  black screen, sonar, the hook line
  descentEnd: 198, // 6.6 s  the plunge from the surface to 1,000 m
  revealEnd: 330, // 11 s   Lumen-6 reveal
  f1End: 378, // 12.6 s  165 mm acrylic
  f2End: 426, // 14.2 s  rated to 4,000 m
  f3End: 480, // 16 s   lights off, bioluminescence
  end: 600, // 20 s   call to action
};

/* Floodlights: dark during the reveal, flicker on, cut for the bioluminescence beat, back for the CTA. */
export function lightsAt(frame: number) {
  const flicker: [number, number][] = [[205, 1], [207, 0], [209, 1], [210, 0.3], [212, 1]];
  if (frame < 205) return 0;
  if (frame < 214) { let v = 0; for (const [f, val] of flicker) if (frame >= f) v = val; return v; }
  if (frame < F.f2End) return 1;
  if (frame < F.f2End + 4) return 1 - (frame - F.f2End) / 4;
  if (frame < 515) return 0;
  return Math.min(1, (frame - 515) / 20);
}

/* How strongly the plankton and jellies glow (peaks while the lights are off). */
export function glowBoostAt(frame: number) {
  const up = Math.min(1, Math.max(0, (frame - F.f2End) / 14));
  const down = Math.min(1, Math.max(0, (frame - 515) / 30));
  return Math.max(0, up - down * 0.75);
}
