import { ThreeCanvas } from '@remotion/three';
import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import { F } from './timeline';
import { World3D } from './World3D';
import './fonts';

export const promoSchema = z.object({
  hookTop: z.string(),
  hookBottom: z.string(),
  descentLine: z.string(),
  vesselName: z.string(),
  vesselLine: z.string(),
  feature1: z.tuple([z.string(), z.string()]),
  feature2: z.tuple([z.string(), z.string()]),
  feature3: z.tuple([z.string(), z.string()]),
  ctaHeadline: z.string(),
  ctaAccent: z.string(),
  ctaDetails: z.string(),
  ctaButton: z.string(),
  accent: zColor(),
  glow: zColor(),
});
export type PromoProps = z.infer<typeof promoSchema>;

export const defaultPromoProps: PromoProps = {
  hookTop: '80% of the ocean',
  hookBottom: 'has never been seen.',
  descentLine: 'So we built a way down.',
  vesselName: 'Lumen‑6',
  vesselLine: 'A glass submersible for six.',
  feature1: ['165 mm of acrylic.', 'Ocean on every side.'],
  feature2: ['Rated to', '4,000 m'],
  feature3: ['Lights off.', 'The ocean glows.'],
  ctaHeadline: 'Go deeper than',
  ctaAccent: 'daylight.',
  ctaDetails: 'Dives from $4,900 · Season 2027 · Kona, Hawaiʻi',
  ctaButton: 'Reserve a seat',
  accent: '#ffb547',
  glow: '#72f2e4',
};

const DISPLAY = '"Big Shoulders", Impact, sans-serif';
const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"Plex Mono", ui-monospace, monospace';
const BODY = '"Hanken", Helvetica, Arial, sans-serif';
const INK = '#eaf5f6';

const useUnit = () => { const { width, height } = useVideoConfig(); return { u: Math.min(width, height) / 1080, portrait: height > width, width, height }; };

/* Words rise in one by one with a little blur, then everything fades out together. */
const Words: React.FC<{ text: string; delay?: number; out?: number; style?: React.CSSProperties; stagger?: number }> = ({ text, delay = 0, out, style, stagger = 3 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = out === undefined ? 1 : interpolate(frame, [out, out + 8], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <span style={{ display: 'inline-block', opacity: fade, ...style }}>
      {text.split(' ').map((w, i) => {
        const s = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 18, stiffness: 140, mass: 0.7 } });
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', transform: `translateY(${(1 - s) * 60}%) rotateX(${(1 - s) * -60}deg)`, opacity: s, filter: `blur(${(1 - s) * 10}px)` }}>
            {w}{i < text.split(' ').length - 1 ? ' ' : ''}
          </span>
        );
      })}
    </span>
  );
};

/* ---------------- 0 – 2.6 s: hook over black ---------------- */
const Hook: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { u } = useUnit();
  const black = interpolate(frame, [62, F.hookEnd], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ring = (offset: number) => {
    const k = ((frame + offset) % 45) / 45;
    return <div style={{ position: 'absolute', width: 520 * u, height: 520 * u, borderRadius: '50%', border: `${2 * u}px solid ${p.glow}`, transform: `scale(${0.1 + k * 1.4})`, opacity: (1 - k) * 0.6 }} />;
  };
  return (
    <AbsoluteFill style={{ background: `rgba(1,5,10,${black})`, alignItems: 'center', justifyContent: 'center' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: black }}>{ring(0)}{ring(22)}</AbsoluteFill>
      <div style={{ textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, color: INK, textTransform: 'uppercase', lineHeight: 0.9, fontSize: 150 * u, letterSpacing: '-0.01em', perspective: 800 }}>
        <Words text={p.hookTop} delay={6} out={64} />
        <br />
        <Words text={p.hookBottom} delay={22} out={64} style={{ fontFamily: SERIF, fontWeight: 400, fontStyle: 'italic', textTransform: 'none', color: p.glow, fontSize: '0.9em' }} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 2.6 – 6.6 s: the plunge, with a live depth gauge ---------------- */
const Descent: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, portrait } = useUnit();
  const dur = F.descentEnd - F.hookEnd;
  const e = Easing.inOut(Easing.cubic)(Math.min(1, frame / dur));
  const depth = Math.round(e * 1000);
  const appear = interpolate(frame, [4, 16], [0, 1], { extrapolateRight: 'clamp' });
  const leave = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: appear * leave, justifyContent: 'center', alignItems: portrait ? 'center' : 'flex-start', padding: portrait ? 0 : `0 ${130 * u}px` }}>
      <div style={{ fontFamily: MONO, color: p.glow, fontSize: 26 * u, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: portrait ? 'center' : 'left' }}>Depth</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, color: INK, fontSize: 300 * u, lineHeight: 0.85, fontVariantNumeric: 'tabular-nums', textShadow: '0 10px 80px rgba(0,0,0,.35)' }}>
        {depth.toLocaleString('en-US')}<span style={{ fontFamily: MONO, fontWeight: 400, fontSize: 60 * u, color: p.accent, marginLeft: 16 * u }}>m</span>
      </div>
      <div style={{ display: 'flex', gap: 48 * u, fontFamily: MONO, color: INK, opacity: 0.8, fontSize: 26 * u, letterSpacing: '0.12em', marginTop: 18 * u }}>
        <span>{(1 + depth / 10.06).toFixed(1)} ATM</span>
        <span>{(24 - 19.5 * Math.min(1, depth / 1000)).toFixed(1)} °C</span>
      </div>
      <div style={{ marginTop: 50 * u, fontFamily: DISPLAY, fontWeight: 800, color: INK, fontSize: 84 * u, textTransform: 'uppercase', perspective: 800 }}>
        <Words text={p.descentLine} delay={44} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 6.6 – 11 s: Lumen-6 ---------------- */
const Reveal: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, portrait } = useUnit();
  const dur = F.revealEnd - F.descentEnd;
  const leave = interpolate(frame, [dur - 10, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const track = interpolate(frame, [20, 70], [0.5, 0.06], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const titleIn = interpolate(frame, [20, 44], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ opacity: leave, justifyContent: portrait ? 'flex-end' : 'center', alignItems: portrait ? 'center' : 'flex-start', padding: portrait ? `0 0 ${260 * u}px` : `0 ${130 * u}px`, textAlign: portrait ? 'center' : 'left' }}>
      <div style={{ fontFamily: MONO, color: p.accent, fontSize: 26 * u, letterSpacing: '0.2em', opacity: titleIn }}>1,000 M · MEET</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', color: INK, fontSize: 230 * u, lineHeight: 0.95, letterSpacing: `${track}em`, opacity: titleIn, filter: `blur(${(1 - titleIn) * 14}px)` }}>{p.vesselName}</div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK, fontSize: 76 * u, textTransform: 'uppercase', marginTop: 10 * u, perspective: 800 }}>
        <Words text={p.vesselLine} delay={48} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 11 – 16 s: three quick feature beats ---------------- */
const Feature: React.FC<{ lines: [string, string]; big?: boolean; accent: string; glow: string; dur: number; index: number }> = ({ lines, big, accent, glow, dur, index }) => {
  const frame = useCurrentFrame();
  const { u, portrait } = useUnit();
  const leave = interpolate(frame, [dur - 7, dur], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bar = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ opacity: leave, justifyContent: portrait ? 'flex-end' : 'center', alignItems: portrait ? 'center' : 'flex-start', padding: portrait ? `0 ${60 * u}px ${280 * u}px` : `0 ${130 * u}px`, textAlign: portrait ? 'center' : 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 * u, fontFamily: MONO, color: accent, fontSize: 24 * u, letterSpacing: '0.2em', marginBottom: 14 * u }}>
        <span>0{index} / 03</span>
        <span style={{ width: 120 * u * bar, height: 2 * u, background: accent, display: 'inline-block' }} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontWeight: 900, color: INK, textTransform: 'uppercase', lineHeight: 0.9, fontSize: (big ? 110 : 120) * u, perspective: 800 }}>
        <Words text={lines[0]} delay={2} stagger={2} />
      </div>
      <div style={{ fontFamily: big ? DISPLAY : SERIF, fontWeight: big ? 900 : 400, fontStyle: big ? 'normal' : 'italic', color: big ? accent : glow, lineHeight: 0.95, fontSize: (big ? 250 : 110) * u, perspective: 800 }}>
        <Words text={lines[1]} delay={9} stagger={2} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------- 16 – 20 s: call to action ---------------- */
const CTA: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { u, portrait } = useUnit();
  const logo = spring({ frame: frame - 2, fps, config: { damping: 14, stiffness: 110 } });
  const word = interpolate(frame, [4, 40], [0.7, 0.2], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const wordIn = interpolate(frame, [4, 22], [0, 1], { extrapolateRight: 'clamp' });
  const btn = spring({ frame: frame - 44, fps, config: { damping: 13, stiffness: 120 } });
  const pulse = (frame % 30) / 30;
  const dim = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });
  const ring = (k: number) => (
    <div style={{ position: 'absolute', width: 300 * u, height: 300 * u, borderRadius: '50%', border: `${2 * u}px solid ${p.glow}`, transform: `scale(${0.4 + k * 2.4})`, opacity: (1 - k) * 0.5 }} />
  );
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(1,6,12,${0.55 * dim}) 0%, rgba(1,6,12,${0.2 * dim}) 70%)` }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `translateY(${-190 * u}px)` }}>
        {ring(((frame) % 50) / 50)}{ring(((frame + 25) % 50) / 50)}
      </AbsoluteFill>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg viewBox="0 0 40 40" width={120 * u} height={120 * u} style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -90}deg)`, color: INK }}>
          <circle cx="20" cy="20" r="17" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M3 20h34" stroke="currentColor" strokeWidth="2" />
          <circle cx="20" cy="20" r="5" fill={p.accent} />
        </svg>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK, fontSize: 110 * u, letterSpacing: `${word}em`, marginRight: `-${word}em`, opacity: wordIn, marginTop: 10 * u }}>HADAL</div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 900, color: INK, textTransform: 'uppercase', fontSize: (portrait ? 120 : 92) * u, lineHeight: 1, marginTop: 34 * u, perspective: 800 }}>
          <Words text={p.ctaHeadline} delay={16} />{portrait ? <br /> : ' '}
          <Words text={p.ctaAccent} delay={26} style={{ fontFamily: SERIF, fontWeight: 400, fontStyle: 'italic', textTransform: 'none', color: p.accent }} />
        </div>
        <div style={{ fontFamily: MONO, color: INK, opacity: 0.8 * interpolate(frame, [34, 48], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }), fontSize: (portrait ? 30 : 26) * u, lineHeight: 1.5, letterSpacing: '0.12em', marginTop: 26 * u, textTransform: 'uppercase', maxWidth: (portrait ? 760 : 1100) * u }}>{p.ctaDetails}</div>
        <div style={{ marginTop: 46 * u, transform: `scale(${btn})`, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: 999, boxShadow: `0 0 0 ${pulse * 26 * u}px rgba(255,181,71,${(1 - pulse) * 0.45})` }} />
          <div style={{ position: 'relative', background: p.accent, color: '#241503', fontFamily: BODY, fontWeight: 600, fontSize: 40 * u, padding: `${22 * u}px ${54 * u}px`, borderRadius: 999, boxShadow: `0 ${16 * u}px ${60 * u}px -${10 * u}px rgba(255,181,71,.8)` }}>{p.ctaButton} ↓</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Documentary-style camera HUD, top-left, visible from the descent on. */
const Hud: React.FC<PromoProps> = (p) => {
  const frame = useCurrentFrame();
  const { u, portrait } = useUnit();
  const on = interpolate(frame, [F.hookEnd, F.hookEnd + 10, F.f3End, F.f3End + 10], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const tc = (f: number) => `00:${String(Math.floor(f / 30)).padStart(2, '0')}:${String(f % 30).padStart(2, '0')}`;
  const rec = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill style={{ opacity: on, padding: `${(portrait ? 90 : 56) * u}px ${(portrait ? 60 : 70) * u}px`, fontFamily: MONO, color: INK, fontSize: 22 * u, letterSpacing: '0.16em', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span><span style={{ color: '#ff5b4a', opacity: rec ? 1 : 0.2 }}>●</span> LUMEN‑6 · CAM 02</span>
        <span style={{ opacity: 0.7 }}>{tc(frame)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
        <span>19.64° N 155.99° W</span>
        <span style={{ color: p.glow }}>HADAL EXPEDITIONS</span>
      </div>
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
      <svg width="100%" height="100%">
        <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 12} stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#g)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Promo: React.FC<PromoProps> = (props) => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#01050a' }}>
      <ThreeCanvas width={width} height={height} linear={false} gl={{ antialias: true, preserveDrawingBuffer: true }}>
        <World3D />
      </ThreeCanvas>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,4,8,.55) 100%)' }} />
      <Hud {...props} />
      <Sequence durationInFrames={F.hookEnd}><Hook {...props} /></Sequence>
      <Sequence from={F.hookEnd} durationInFrames={F.descentEnd - F.hookEnd}><Descent {...props} /></Sequence>
      <Sequence from={F.descentEnd} durationInFrames={F.revealEnd - F.descentEnd}><Reveal {...props} /></Sequence>
      <Sequence from={F.revealEnd} durationInFrames={F.f1End - F.revealEnd}><Feature index={1} lines={props.feature1} accent={props.accent} glow={props.glow} dur={F.f1End - F.revealEnd} /></Sequence>
      <Sequence from={F.f1End} durationInFrames={F.f2End - F.f1End}><Feature index={2} lines={props.feature2} big accent={props.accent} glow={props.glow} dur={F.f2End - F.f1End} /></Sequence>
      <Sequence from={F.f2End} durationInFrames={F.f3End - F.f2End}><Feature index={3} lines={props.feature3} accent={props.accent} glow={props.glow} dur={F.f3End - F.f2End} /></Sequence>
      <Sequence from={F.f3End}><CTA {...props} /></Sequence>
      <Grain />
      <Audio src={staticFile('soundtrack.wav')} />
    </AbsoluteFill>
  );
};
