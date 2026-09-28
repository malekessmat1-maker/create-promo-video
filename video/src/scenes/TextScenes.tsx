import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {C, F, useLayout} from '../theme';
import {
  Body,
  BrandMark,
  CornerMark,
  Eyebrow,
  Flash,
  Grain,
  LightSweep,
  LineReveal,
  LineSpec,
  Photo,
  PhotoSpec,
  Stage,
  useProgress,
  useSpring,
  Vignette,
  Wordmark,
} from '../components/ui';

/* ------------------------------------------------------------------ */
/* Cold open: black frame, one or two typographic beats.               */
/* ------------------------------------------------------------------ */
export type ColdOpenProps = {
  eyebrow?: string;
  beats: {at: number; lines: LineSpec[]; linesP?: LineSpec[]}[];
};

export const ColdOpen: React.FC<ColdOpenProps & {dur: number}> = ({eyebrow, beats, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const size = portrait ? 118 * u : 150 * u;
  const lineW = useProgress(2, 40);
  const glow = interpolate(frame, [0, dur], [0.25, 0.5]);
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 120%, rgba(255,90,31,${glow}) 0%, transparent 55%)`,
        }}
      />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: portrait ? 80 * u : 120 * u}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 36 * u}}>
          {eyebrow ? <Eyebrow text={eyebrow} size={(portrait ? 26 : 24) * u} align="center" delay={2} /> : null}
          <div style={{position: 'relative', minHeight: size * 2.05}}>
            {beats.map((b, i) => {
              const next = beats[i + 1]?.at ?? dur + 20;
              if (frame < b.at - 1 || frame > next) return null;
              return (
                <Sequence key={i} from={b.at} layout="none">
                  <LineReveal lines={portrait && b.linesP ? b.linesP : b.lines} size={size} fitWidth={(portrait ? 920 : 1640) * u} align="center" stagger={6} exitAt={beats[i + 1] ? next - b.at - 10 : undefined} />
                </Sequence>
              );
            })}
          </div>
          <div style={{width: (portrait ? 420 : 640) * u * lineW, height: 3 * u, background: `linear-gradient(90deg, transparent, ${C.orange}, transparent)`}} />
        </div>
      </AbsoluteFill>
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Photo statement: graded photo, eyebrow + headline + optional body.  */
/* ------------------------------------------------------------------ */
export type PhotoStatementProps = {
  photo: PhotoSpec;
  eyebrow?: string;
  lines: LineSpec[];
  linesP?: LineSpec[];
  body?: string;
  sweepAt?: number;
  size?: number;
};

export const PhotoStatement: React.FC<PhotoStatementProps & {dur: number}> = ({photo, eyebrow, lines, linesP, body, sweepAt = 16, dur, size}) => {
  const {u, portrait} = useLayout();
  const fs = (size ?? (portrait ? 104 : 124)) * u;
  return (
    <AbsoluteFill>
      <Photo photo={photo} dur={dur} />
      <LightSweep start={sweepAt} duration={46} opacity={0.22} />
      <Stage>
        <div style={{display: 'flex', flexDirection: 'column', gap: 30 * u, maxWidth: portrait ? 940 * u : 1400 * u}}>
          {eyebrow ? <Eyebrow text={eyebrow} size={(portrait ? 26 : 24) * u} delay={4} /> : null}
          <LineReveal lines={portrait && linesP ? linesP : lines} size={fs} delay={8} fitWidth={(portrait ? 920 : 1640) * u} />
          {body ? <Body text={body} size={(portrait ? 36 : 32) * u} delay={24} maxWidth={portrait ? 900 * u : 980 * u} /> : null}
        </div>
      </Stage>
      <CornerMark />
      <Grain />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Scratch: the "expensive mistake" moment. A scratch tears the paint. */
/* ------------------------------------------------------------------ */
export type ScratchProps = {photo: PhotoSpec; lines: LineSpec[]; linesP?: LineSpec[]; eyebrow?: string; hitAt?: number};

export const Scratch: React.FC<ScratchProps & {dur: number}> = ({photo, lines, linesP, eyebrow, hitAt = 30, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait, width, height} = useLayout();
  const draw = interpolate(frame, [hitAt, hitAt + 7], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });
  const after = frame >= hitAt;
  const shakeAmt = interpolate(frame, [hitAt, hitAt + 10], [6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shakeX = after ? Math.sin(frame * 2.7) * shakeAmt * u : 0;
  const shakeY = after ? Math.cos(frame * 3.3) * shakeAmt * 0.6 * u : 0;
  const gray = interpolate(frame, [hitAt, hitAt + 20], [0, 0.85], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bright = interpolate(frame, [hitAt, hitAt + 20], [0.8, 0.5], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // A jagged gouge across the body panel.
  const pts: [number, number][] = portrait
    ? [
        [0.08, 0.36],
        [0.3, 0.41],
        [0.46, 0.4],
        [0.62, 0.46],
        [0.8, 0.47],
        [0.95, 0.53],
      ]
    : [
        [0.12, 0.5],
        [0.3, 0.56],
        [0.44, 0.54],
        [0.58, 0.61],
        [0.74, 0.62],
        [0.9, 0.7],
      ];
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x * width} ${y * height}`).join(' ');
  const len = pts.reduce((acc, p, i) => (i === 0 ? 0 : acc + Math.hypot((p[0] - pts[i - 1][0]) * width, (p[1] - pts[i - 1][1]) * height)), 0);

  return (
    <AbsoluteFill style={{transform: `translate(${shakeX}px, ${shakeY}px)`}}>
      <Photo photo={photo} dur={dur} brightness={bright} grayscale={gray} orangeWash={!after} />
      <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="scratchGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={6 * u} />
          </filter>
        </defs>
        <path d={d} stroke={C.orange} strokeWidth={14 * u} fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#scratchGlow)" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} opacity={0.9} />
        <path d={d} stroke="#fff6ee" strokeWidth={3.5 * u} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      </svg>
      <Flash at={hitAt} color={C.orange} peak={0.22} length={10} />
      <Stage>
        <div style={{display: 'flex', flexDirection: 'column', gap: 26 * u}}>
          {eyebrow ? <Eyebrow text={eyebrow} size={(portrait ? 26 : 24) * u} delay={4} /> : null}
          <Sequence from={hitAt + 4} layout="none">
            <LineReveal lines={portrait && linesP ? linesP : lines} size={(portrait ? 104 : 124) * u} fitWidth={(portrait ? 920 : 1640) * u} />
          </Sequence>
        </div>
      </Stage>
      <CornerMark />
      <Grain opacity={0.1} />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Logo reveal.                                                         */
/* ------------------------------------------------------------------ */
export type LogoRevealProps = {tagline: string; eyebrow?: string};

export const LogoReveal: React.FC<LogoRevealProps & {dur: number}> = ({tagline, eyebrow, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const draw = useProgress(2, 26);
  const word = useSpring(22, 200, 30);
  const tag = useSpring(44, 200, 24);
  const markSize = (portrait ? 150 : 170) * u;
  const wordSize = (portrait ? 104 : 150) * u;
  const tracking = interpolate(word, [0, 1], [0.6, 0.13]);
  const glow = interpolate(frame, [0, 30, dur], [0, 0.55, 0.35], {extrapolateRight: 'clamp'});
  const push = interpolate(frame, [0, dur], [1, 1.05]);
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 55%, rgba(255,90,31,${glow * 0.5}) 0%, transparent 50%)`}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', transform: `scale(${push})`}}>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 44 * u}}>
          <BrandMark size={markSize} draw={draw} />
          <div style={{opacity: word, transform: `translateY(${(1 - word) * 20}px)`, position: 'relative'}}>
            <Wordmark size={wordSize} tracking={tracking} />
          </div>
          <div style={{opacity: tag, transform: `translateY(${(1 - tag) * 14}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 * u}}>
            <div style={{width: 120 * u, height: 3 * u, background: C.orange}} />
            <div style={{fontFamily: F.body, fontWeight: 500, fontSize: (portrait ? 40 : 38) * u, color: C.paper, letterSpacing: '0.02em', textAlign: 'center'}}>
              {tagline}
            </div>
            {eyebrow ? (
              <div style={{fontFamily: F.body, fontWeight: 700, fontSize: (portrait ? 24 : 22) * u, color: C.orange, letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center'}}>
                {eyebrow}
              </div>
            ) : null}
          </div>
        </div>
      </AbsoluteFill>
      <LightSweep start={30} duration={50} opacity={0.4} width={10} />
      <Flash at={22} color={C.orange} peak={0.25} length={12} />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Big number (growth results).                                        */
/* ------------------------------------------------------------------ */
export type BigNumberProps = {
  eyebrow: string;
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
  body?: string;
  photo?: PhotoSpec;
};

export const BigNumber: React.FC<BigNumberProps & {dur: number}> = ({eyebrow, prefix = '', value, suffix = '', label, body, photo, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const count = interpolate(frame, [10, 58], [0, value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const numIn = useSpring(8, 200, 20);
  const pulse = interpolate(frame, [58, 64, 76], [1, 1.04, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      {photo ? (
        <AbsoluteFill style={{opacity: 0.35}}>
          <Photo photo={photo} dur={dur} brightness={0.5} orangeWash={false} />
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 30% 60%, rgba(255,90,31,.25), transparent 60%)'}} />
      <Stage align="center">
        <div style={{display: 'flex', flexDirection: 'column', gap: 24 * u}}>
          <Eyebrow text={eyebrow} size={(portrait ? 24 : 24) * u} delay={2} />
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: (portrait ? 300 : 360) * u,
              lineHeight: 0.9,
              letterSpacing: '-0.04em',
              color: C.paper,
              opacity: numIn,
              transform: `scale(${pulse})`,
              transformOrigin: 'left center',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {prefix}
            {Math.round(count)}
            <span style={{color: C.orange}}>{suffix}</span>
          </div>
          <LineReveal lines={[label]} size={(portrait ? 64 : 72) * u} delay={30} fitWidth={(portrait ? 920 : 1640) * u} />
          {body ? <Body text={body} size={(portrait ? 34 : 32) * u} delay={60} maxWidth={portrait ? 900 * u : 1100 * u} /> : null}
        </div>
      </Stage>
      <LightSweep start={60} duration={40} opacity={0.2} />
      <CornerMark />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
