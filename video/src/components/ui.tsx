import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {C, F, useLayout} from '../theme';

export const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const useSpring = (delay = 0, damping = 200, durationInFrames?: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: frame - delay, fps, config: {damping}, durationInFrames});
};

/** Linear 0→1 between two frames with the house easing. */
export const useProgress = (from: number, to: number, easing = ease) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, to], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing,
  });
};

export type PhotoSpec = {
  src: string;
  /** object-position for landscape */
  pos?: string;
  /** object-position for portrait */
  posP?: string;
};

/** Full-bleed photograph with slow cinematic push and brand grade. */
export const Photo: React.FC<{
  photo: PhotoSpec;
  dur: number;
  zoom?: [number, number];
  drift?: number;
  brightness?: number;
  grayscale?: number;
  orangeWash?: boolean;
  bottomFade?: boolean;
}> = ({photo, dur, zoom = [1.08, 1.18], drift = 30, brightness = 0.72, grayscale = 0, orangeWash = true, bottomFade = true}) => {
  const frame = useCurrentFrame();
  const {portrait, u} = useLayout();
  const t = interpolate(frame, [0, dur], [0, 1], {extrapolateRight: 'clamp'});
  const scale = interpolate(t, [0, 1], zoom);
  const x = interpolate(t, [0, 1], [-drift / 2, drift / 2]) * u;
  return (
    <AbsoluteFill style={{backgroundColor: C.ink, overflow: 'hidden'}}>
      <Img
        src={staticFile(`img/${photo.src}`)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: portrait ? photo.posP ?? '50% 50%' : photo.pos ?? '50% 50%',
          transform: `translateX(${x}px) scale(${scale})`,
          filter: `saturate(${0.78 * (1 - grayscale)}) contrast(1.12) brightness(${brightness}) grayscale(${grayscale})`,
        }}
      />
      {bottomFade ? (
        <AbsoluteFill
          style={{
            background: portrait
              ? 'linear-gradient(180deg, rgba(7,7,7,.55) 0%, transparent 30%, transparent 45%, rgba(7,7,7,.94) 82%)'
              : 'linear-gradient(180deg, rgba(7,7,7,.35) 0%, transparent 35%, rgba(7,7,7,.92) 100%)',
          }}
        />
      ) : null}
      {orangeWash ? (
        <AbsoluteFill
          style={{background: 'linear-gradient(90deg, rgba(255,90,31,.18), transparent 42%)', mixBlendMode: 'screen'}}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Moving film grain from a pre-rendered noise tile. */
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => {
  const frame = useCurrentFrame();
  const x = Math.floor(random(`gx${frame}`) * 512);
  const y = Math.floor(random(`gy${frame}`) * 512);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${staticFile('noise.png')})`,
        backgroundPosition: `${x}px ${y}px`,
        opacity,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.65}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: 'none',
    }}
  />
);

/** A diagonal band of warm light gliding across — like a reflection on fresh paint. */
export const LightSweep: React.FC<{start: number; duration?: number; opacity?: number; width?: number}> = ({
  start,
  duration = 40,
  opacity = 0.35,
  width = 18,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + duration], [-40, 140], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  if (frame < start || frame > start + duration) return null;
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(105deg, transparent ${p - width}%, rgba(255,138,0,${opacity * 0.5}) ${p - width / 3}%, rgba(255,245,235,${opacity}) ${p}%, rgba(255,90,31,${opacity * 0.4}) ${p + width / 3}%, transparent ${p + width}%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

export type LineSpec = string | {text: string; color?: string};

/** Lines rising out of a mask, staggered. */
export const LineReveal: React.FC<{
  lines: LineSpec[];
  delay?: number;
  stagger?: number;
  size: number;
  color?: string;
  font?: string;
  weight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
  exitAt?: number;
  /** Shrink the type so the longest line fits this width (px). */
  fitWidth?: number;
}> = ({
  lines,
  delay = 0,
  stagger = 5,
  size,
  color = C.paper,
  font = F.display,
  weight = 600,
  lineHeight = 0.98,
  letterSpacing = '-0.02em',
  uppercase = true,
  align = 'left',
  exitAt,
  fitWidth,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const longest = Math.max(...lines.map((l) => (typeof l === 'string' ? l : l.text).length));
  // Oswald caps average ~0.46em per character; 0.48 keeps a safety margin.
  const fs = fitWidth ? Math.min(size, fitWidth / (longest * 0.48)) : size;
  size = fs;
  return (
    <div style={{display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}}>
      {lines.map((l, i) => {
        const spec = typeof l === 'string' ? {text: l} : l;
        const s = spring({frame: frame - delay - i * stagger, fps, config: {damping: 200}, durationInFrames: 22});
        const out =
          exitAt === undefined
            ? 0
            : interpolate(frame, [exitAt + i * 2, exitAt + 10 + i * 2], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.in(Easing.cubic),
              });
        return (
          <div key={i} style={{overflow: 'hidden', paddingBottom: size * 0.06, marginBottom: -size * 0.06}}>
            <div
              style={{
                transform: `translateY(${(1 - s) * 105 - out * 105}%)`,
                fontFamily: font,
                fontWeight: weight,
                fontSize: size,
                lineHeight,
                letterSpacing,
                color: spec.color ?? color,
                textTransform: uppercase ? 'uppercase' : 'none',
                textAlign: align,
                whiteSpace: 'nowrap',
              }}
            >
              {spec.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const Eyebrow: React.FC<{text: string; delay?: number; size?: number; color?: string; align?: 'left' | 'center'}> = ({
  text,
  delay = 0,
  size = 22,
  color = C.orange,
  align = 'left',
}) => {
  const s = useSpring(delay, 200, 20);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: size * 0.8,
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        opacity: s,
      }}
    >
      <div style={{width: size * 2.4 * s, height: Math.max(2, size * 0.1), background: color}} />
      <div
        style={{
          fontFamily: F.body,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color,
          transform: `translateX(${(1 - s) * 20}px)`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Body: React.FC<{text: string; delay?: number; size: number; color?: string; maxWidth?: number; align?: 'left' | 'center'}> = ({
  text,
  delay = 0,
  size,
  color = '#c9c9c4',
  maxWidth,
  align = 'left',
}) => {
  const s = useSpring(delay, 200, 24);
  return (
    <div
      style={{
        fontFamily: F.body,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.5,
        color,
        maxWidth,
        opacity: s,
        textAlign: align,
        transform: `translateY(${(1 - s) * 18}px)`,
      }}
    >
      {text}
    </div>
  );
};

/** The skewed orange-outlined "V" mark from the site header. */
export const BrandMark: React.FC<{size: number; draw?: number; strokeW?: number}> = ({size, draw = 1, strokeW}) => {
  const sw = strokeW ?? Math.max(2, size * 0.07);
  const perim = 4 * size;
  return (
    <div style={{width: size, height: size, transform: 'skew(-13deg)', position: 'relative'}}>
      <svg width={size} height={size} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
        <rect
          x={sw / 2}
          y={sw / 2}
          width={size - sw}
          height={size - sw}
          fill="none"
          stroke={C.orange}
          strokeWidth={sw}
          strokeDasharray={perim}
          strokeDashoffset={perim * (1 - draw)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          fontFamily: F.display,
          fontWeight: 600,
          fontSize: size * 0.5,
          color: C.orange,
          opacity: interpolate(draw, [0.6, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
          transform: 'skew(13deg)',
        }}
      >
        V
      </div>
    </div>
  );
};

export const Wordmark: React.FC<{size: number; tracking?: number; color?: string}> = ({size, tracking = 0.13, color = C.paper}) => (
  <div
    style={{
      fontFamily: F.display,
      fontWeight: 500,
      fontSize: size,
      letterSpacing: `${tracking}em`,
      color,
      whiteSpace: 'nowrap',
      lineHeight: 1,
    }}
  >
    VEYLON AUTO
  </div>
);

/** Small persistent brand bug for photo scenes. */
export const CornerMark: React.FC = () => {
  const {u, portrait} = useLayout();
  const s = useSpring(4, 200, 20);
  return (
    <div
      style={{
        position: 'absolute',
        top: (portrait ? 90 : 60) * u,
        left: (portrait ? 70 : 90) * u,
        display: 'flex',
        alignItems: 'center',
        gap: 14 * u,
        opacity: 0.9 * s,
      }}
    >
      <BrandMark size={30 * u} />
      <Wordmark size={22 * u} />
    </div>
  );
};

/** Short flash used on hard hits. */
export const Flash: React.FC<{at?: number; color?: string; peak?: number; length?: number}> = ({
  at = 0,
  color = C.paper,
  peak = 0.5,
  length = 8,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + length], [0, peak, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (o <= 0) return null;
  return <AbsoluteFill style={{backgroundColor: color, opacity: o, mixBlendMode: 'screen', pointerEvents: 'none'}} />;
};

/** Frame-safe padding wrapper that positions content in the lower-left (landscape) or lower third (portrait). */
export const Stage: React.FC<{children: React.ReactNode; align?: 'bottom' | 'center'; center?: boolean}> = ({
  children,
  align = 'bottom',
  center = false,
}) => {
  const {u, portrait} = useLayout();
  return (
    <AbsoluteFill
      style={{
        padding: portrait ? `${230 * u}px ${80 * u}px ${380 * u}px` : `${110 * u}px ${130 * u}px ${120 * u}px`,
        justifyContent: align === 'bottom' ? 'flex-end' : 'center',
        alignItems: center ? 'center' : 'flex-start',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
