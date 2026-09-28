import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {C, CONTACT, F, useLayout} from '../theme';
import {Eyebrow, Flash, Grain, LightSweep, LineReveal, LineSpec, Vignette} from '../components/ui';

/*
 * Website feature scenes. Everything inside the device is positioned in the
 * website's own CSS pixels (desktop viewport 1440×900, mobile 390×844), using
 * real captures of veylonauto.vercel.app, so cursor targets match the real UI.
 */

type Kind = 'desktop' | 'mobile';
const VIEW: Record<Kind, {w: number; h: number}> = {desktop: {w: 1440, h: 900}, mobile: {w: 390, h: 844}};

const useDevice = () => {
  const {portrait, u} = useLayout();
  const kind: Kind = portrait ? 'mobile' : 'desktop';
  const contentW = (portrait ? 560 : 1300) * u;
  const k = contentW / VIEW[kind].w;
  const contentH = VIEW[kind].h * k;
  const top = (portrait ? 16 : 50) * u; // browser bar / phone bezel
  const side = (portrait ? 16 : 0) * u;
  const devW = contentW + side * 2;
  const devH = contentH + top + (portrait ? 16 * u : 0);
  return {kind, portrait, u, k, contentW, contentH, top, side, devW, devH};
};

export type Cam = {x: number; y: number; z: number; rx: number; ry: number; rz: number};
const WIDE: Cam = {x: 0, y: 0, z: 1, rx: 0, ry: 0, rz: 0};

/** Camera that puts website point (cssX, cssY) at the stage centre, shifted by (dx, dy). */
const useFocus = () => {
  const d = useDevice();
  return (cssX: number, cssY: number, z: number, extra: Partial<Cam> = {}, dx = 0, dy = 0): Cam => {
    const px = d.side + cssX * d.k - d.devW / 2;
    const py = d.top + cssY * d.k - d.devH / 2;
    return {...WIDE, ...extra, x: -px * z + dx * d.u, y: -py * z + dy * d.u, z};
  };
};

const camAt = (frame: number, keys: [number, Cam][], easing = Easing.inOut(Easing.cubic)): Cam => {
  const frames = keys.map((kf) => kf[0]);
  const prop = (p: keyof Cam) =>
    keys.length === 1
      ? keys[0][1][p]
      : interpolate(frame, frames, keys.map((kf) => kf[1][p]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
  return {x: prop('x'), y: prop('y'), z: prop('z'), rx: prop('rx'), ry: prop('ry'), rz: prop('rz')};
};

/* ------------------------------------------------------------------ */
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const a = Math.sin(frame / 40) * 8;
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${30 + a}% 110%, rgba(255,90,31,.34) 0%, transparent 55%)`}} />
      <AbsoluteFill style={{background: `radial-gradient(ellipse at ${85 - a}% -10%, rgba(255,138,0,.14) 0%, transparent 50%)`}} />
      <AbsoluteFill
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          backgroundPosition: `0 ${frame * 0.6}px`,
          maskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, #000 20%, transparent 75%)',
        }}
      />
    </AbsoluteFill>
  );
};

/** Browser window (landscape) or phone (portrait) holding website content in CSS px. */
const Device: React.FC<{cam: Cam; url?: string; typed?: number; children: React.ReactNode}> = ({cam, url = CONTACT.url, typed = 1, children}) => {
  const d = useDevice();
  const {u} = d;
  const frame = useCurrentFrame();
  const shown = url.slice(0, Math.round(url.length * typed));
  const caret = typed < 1 || Math.floor(frame / 10) % 2 === 0;
  const glare = interpolate(Math.sin(frame / 50), [-1, 1], [-30, 30]);
  return (
    <AbsoluteFill style={{perspective: 2400 * u, justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          width: d.devW,
          height: d.devH,
          position: 'relative',
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
          borderRadius: (d.portrait ? 72 : 20) * u,
          background: d.portrait ? '#0b0b0b' : '#141414',
          border: `${1.5 * u}px solid ${d.portrait ? '#2c2c2c' : '#2a2a2a'}`,
          boxShadow: `0 ${60 * u}px ${160 * u}px rgba(0,0,0,.75), 0 ${30 * u}px ${140 * u}px rgba(255,90,31,.22)`,
          overflow: 'hidden',
        }}
      >
        {d.portrait ? null : (
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: d.top, display: 'flex', alignItems: 'center', padding: `0 ${20 * u}px`, gap: 9 * u}}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <div key={c} style={{width: 13 * u, height: 13 * u, borderRadius: 99, background: c}} />
            ))}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 520 * u,
                height: 32 * u,
                borderRadius: 99,
                background: '#0b0b0b',
                border: `${1 * u}px solid #2a2a2a`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10 * u,
                fontFamily: F.body,
                fontSize: 17 * u,
                color: C.paper,
              }}
            >
              <svg width={13 * u} height={15 * u} viewBox="0 0 13 15">
                <rect x="1" y="6" width="11" height="8" rx="2" fill={C.muted} />
                <path d="M3.5 6V4.5a3 3 0 0 1 6 0V6" stroke={C.muted} strokeWidth="1.6" fill="none" />
              </svg>
              <span>
                {shown}
                <span style={{opacity: caret && typed < 1 ? 1 : 0, color: C.orange}}>|</span>
              </span>
            </div>
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            left: d.side,
            top: d.top,
            width: d.contentW,
            height: d.contentH,
            overflow: 'hidden',
            borderRadius: d.portrait ? 56 * u : `0 0 ${18 * u}px ${18 * u}px`,
            background: C.paper,
          }}
        >
          <div style={{position: 'absolute', left: 0, top: 0, width: VIEW[d.kind].w, height: VIEW[d.kind].h, transform: `scale(${d.k})`, transformOrigin: '0 0'}}>{children}</div>
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${40 + glare}%, rgba(255,255,255,.10) ${50 + glare}%, transparent ${60 + glare}%)`, pointerEvents: 'none'}} />
        </div>
        {d.portrait ? (
          <div style={{position: 'absolute', top: 30 * u, left: '50%', transform: 'translateX(-50%)', width: 150 * u, height: 40 * u, borderRadius: 99, background: '#000'}} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Full-viewport screenshot in CSS px. */
const Shot: React.FC<{name: string; opacity?: number; clip?: string; scale?: number}> = ({name, opacity = 1, clip, scale = 1}) => {
  const {kind} = useDevice();
  return (
    <Img
      src={staticFile(`site/${kind === 'desktop' ? 'd' : 'm'}-${name}.jpg`)}
      style={{position: 'absolute', left: 0, top: 0, width: VIEW[kind].w, height: VIEW[kind].h, opacity, clipPath: clip, transform: `scale(${scale})`}}
    />
  );
};

/** Pointer (desktop) or touch ripple (mobile), in CSS px. */
const Pointer: React.FC<{x: number; y: number; clicks: number[]; show: number}> = ({x, y, clicks, show}) => {
  const {kind} = useDevice();
  const frame = useCurrentFrame();
  const last = clicks.filter((c) => frame >= c).pop();
  const since = last === undefined ? 99 : frame - last;
  const ripple = interpolate(since, [0, 14], [0, 1], {extrapolateRight: 'clamp'});
  const press = interpolate(since, [0, 3, 8], [1, 0.82, 1], {extrapolateRight: 'clamp'});
  const rippleR = kind === 'desktop' ? 34 : 30;
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: show, pointerEvents: 'none'}}>
      {since < 14 ? (
        <div
          style={{
            position: 'absolute',
            left: -rippleR * ripple,
            top: -rippleR * ripple,
            width: rippleR * 2 * ripple,
            height: rippleR * 2 * ripple,
            borderRadius: 999,
            border: `3px solid ${C.orange}`,
            opacity: 1 - ripple,
          }}
        />
      ) : null}
      {kind === 'desktop' ? (
        <svg width={26} height={34} viewBox="0 0 34 44" style={{transform: `scale(${press})`, transformOrigin: '0 0', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,.45))'}}>
          <path d="M2 2 L2 36 L11 27 L17 41 L23 38 L17 25 L30 25 Z" fill="#111" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      ) : (
        <div style={{position: 'absolute', left: -18, top: -18, width: 36, height: 36, borderRadius: 99, background: 'rgba(17,17,17,.35)', border: '2px solid rgba(255,255,255,.9)', transform: `scale(${press})`}} />
      )}
    </div>
  );
};

/** Caption for website scenes: lower-left plate (landscape) or top block (portrait). */
export type Caption = {eyebrow?: string; lines: LineSpec[]; linesP?: LineSpec[]};

const CaptionBlock: React.FC<{cap: Caption; exitAt?: number}> = ({cap, exitAt}) => {
  const {portrait, u} = useLayout();
  const frame = useCurrentFrame();
  const out = exitAt === undefined ? 1 : interpolate(frame, [exitAt, exitAt + 8], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const lines = portrait && cap.linesP ? cap.linesP : cap.lines;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: out}}>
      {portrait ? (
        <>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 620 * u, background: 'linear-gradient(180deg, rgba(7,7,7,.96) 0%, rgba(7,7,7,.9) 62%, rgba(7,7,7,0) 100%)'}} />
        <div style={{position: 'absolute', top: 150 * u, left: 70 * u, right: 70 * u, display: 'flex', flexDirection: 'column', gap: 18 * u, alignItems: 'center'}}>
          {cap.eyebrow ? <Eyebrow text={cap.eyebrow} size={24 * u} align="center" delay={2} /> : null}
          <LineReveal lines={lines} size={92 * u} delay={4} align="center" fitWidth={940 * u} />
        </div>
        </>
      ) : (
        <div
          style={{
            position: 'absolute',
            left: 80 * u,
            bottom: 70 * u,
            padding: `${34 * u}px ${44 * u}px ${38 * u}px`,
            background: 'rgba(7,7,7,.82)',
            border: `${1.5 * u}px solid rgba(255,255,255,.08)`,
            borderLeft: `${5 * u}px solid ${C.orange}`,
            borderRadius: 18 * u,
            backdropFilter: 'blur(14px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16 * u,
            boxShadow: '0 30px 80px rgba(0,0,0,.5)',
          }}
        >
          {cap.eyebrow ? <Eyebrow text={cap.eyebrow} size={20 * u} delay={2} /> : null}
          <LineReveal lines={lines} size={84 * u} delay={4} fitWidth={760 * u} />
        </div>
      )}
    </AbsoluteFill>
  );
};

const Frame: React.FC<{children: React.ReactNode; captions?: React.ReactNode}> = ({children, captions}) => (
  <AbsoluteFill>
    <Backdrop />
    {children}
    {captions}
    <Grain opacity={0.05} />
    <Vignette strength={0.55} />
  </AbsoluteFill>
);

/* ------------------------------------------------------------------ */
/* Hero reveal: starts inside the site's own headline, pulls back.      */
/* ------------------------------------------------------------------ */
const HERO_FOCUS: Record<string, Record<Kind, [number, number, number]>> = {
  // [cssX, cssY, zoom] framing each page's headline
  hero: {desktop: [390, 420, 1.9], mobile: [160, 300, 2.3]},
  'growth-hero': {desktop: [626, 360, 1.5], mobile: [198, 315, 1.8]},
};

export type SiteHeroProps = {shot: 'hero' | 'growth-hero'; caption?: Caption; revealAt?: number};

export const SiteHero: React.FC<SiteHeroProps & {dur: number}> = ({shot, caption, revealAt = 60, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const [fx, fy, fz] = HERO_FOCUS[shot][d.kind];
  const start = focus(fx, fy, fz);
  const drift = focus(fx + (d.portrait ? 0 : 60), fy + 20, fz * 1.04);
  const wideA: Cam = d.portrait ? {x: 0, y: 250 * d.u, z: 1.14, rx: 10, ry: -8, rz: 1.5} : {x: 150 * d.u, y: -20 * d.u, z: 1.04, rx: 8, ry: -14, rz: 1};
  const wideB: Cam = d.portrait ? {x: 0, y: 260 * d.u, z: 1.18, rx: 4, ry: -2, rz: 0} : {x: 190 * d.u, y: -30 * d.u, z: 1.1, rx: 4, ry: -8, rz: 0};
  const cam = frame < revealAt
    ? camAt(frame, [[0, start], [revealAt - 26, drift], [revealAt, wideA]], Easing.inOut(Easing.cubic))
    : camAt(frame, [[revealAt, wideA], [dur, wideB]], Easing.out(Easing.quad));
  const typed = interpolate(frame, [revealAt - 4, revealAt + 26], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Frame
      captions={
        caption ? (
          <Sequence from={revealAt + 10} layout="none">
            <CaptionBlock cap={caption} />
          </Sequence>
        ) : null
      }
    >
      <Device cam={cam} typed={typed}>
        <Shot name={shot} />
      </Device>
      <LightSweep start={revealAt - 6} duration={36} opacity={0.35} width={10} />
      <Flash at={revealAt} color={C.orange} peak={0.18} length={10} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Scrolling through a full page with captions per stop.               */
/* ------------------------------------------------------------------ */
const SCROLL: Record<string, Record<Kind, {img: string; h: number; stops: number[]}>> = {
  market: {
    desktop: {img: 'd-market-full.jpg', h: 5200, stops: [1234, 2000, 3300]},
    mobile: {img: 'm-market-full.jpg', h: 3600, stops: [1478, 2183, 2756]},
  },
  growth: {
    desktop: {img: 'd-growth-full.jpg', h: 5399, stops: [300, 1180, 2380, 3345]},
    mobile: {img: 'm-growth-full.jpg', h: 5825, stops: [500, 1400, 2905, 4184]},
  },
};

export type SiteScrollProps = {page: 'market' | 'growth'; captions: Caption[]; stops?: number[]};

export const SiteScroll: React.FC<SiteScrollProps & {dur: number}> = ({page, captions, stops: pick, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const spec = SCROLL[page][d.kind];
  const stops = (pick ?? spec.stops.map((_, i) => i)).map((i) => spec.stops[i]);
  const seg = Math.floor(dur / stops.length);
  const MOVE = 16;
  // Arrive at each stop at i*seg (the first stop is reached from 700px above).
  const keysF: number[] = [0];
  const keysY: number[] = [Math.max(0, stops[0] - 700)];
  stops.forEach((y, i) => {
    const arrive = i === 0 ? MOVE : i * seg + MOVE;
    if (i > 0) {
      keysF.push(i * seg);
      keysY.push(stops[i - 1]);
    }
    keysF.push(arrive);
    keysY.push(y);
  });
  const y = interpolate(frame, keysF, keysY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const yPrev = interpolate(Math.max(0, frame - 1), keysF, keysY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const blur = Math.min(5, Math.abs(y - yPrev) * 0.03);
  const cam = camAt(
    frame,
    d.portrait
      ? [
          [0, {x: 0, y: 260 * d.u, z: 1.14, rx: 6, ry: 4, rz: -1}],
          [dur, {x: 0, y: 260 * d.u, z: 1.18, rx: 2, ry: -3, rz: 0}],
        ]
      : [
          [0, {x: 200 * d.u, y: -40 * d.u, z: 1.08, rx: 6, ry: -12, rz: 0}],
          [dur, {x: 230 * d.u, y: -40 * d.u, z: 1.12, rx: 3, ry: -6, rz: 0}],
        ],
    Easing.linear,
  );
  return (
    <Frame
      captions={captions.slice(0, stops.length).map((c, i) => (
        <Sequence key={i} from={i * seg + 4} durationInFrames={i === stops.length - 1 ? dur - i * seg - 4 : seg - 4} layout="none">
          <CaptionBlock cap={c} exitAt={i === stops.length - 1 ? undefined : seg - 12} />
        </Sequence>
      ))}
    >
      <Device cam={cam}>
        <Img
          src={staticFile(`site/${spec.img}`)}
          style={{position: 'absolute', left: 0, top: 0, width: VIEW[d.kind].w, height: spec.h, transform: `translateY(${-y}px)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}
        />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Live filtering: City → Madrid, Treatment → PPF.                     */
/* ------------------------------------------------------------------ */
const FILTER_POS: Record<Kind, {city: [number, number]; service: [number, number]; bar: [number, number]; cards: [number, number]; start: [number, number]}> = {
  desktop: {city: [838, 652], service: [1168, 652], bar: [1000, 640], cards: [720, 640], start: [1250, 820]},
  mobile: {city: [195, 577], service: [195, 643], bar: [195, 610], cards: [195, 560], start: [300, 780]},
};

export type SiteFilterProps = {caption: Caption};

export const SiteFilter: React.FC<SiteFilterProps & {dur: number}> = ({caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const P = FILTER_POS[d.kind];
  const C1 = 30;
  const C2 = 58;
  const dx = d.portrait ? 0 : 180;
  const dy = d.portrait ? 260 : -40;
  const cam = camAt(frame, [
    [0, focus(P.cards[0], P.cards[1], d.portrait ? 1.08 : 0.92, {rx: 6, ry: d.portrait ? 3 : -10}, dx, dy)],
    [22, focus(P.bar[0], P.bar[1], d.portrait ? 1.25 : 1.45, {rx: 2, ry: d.portrait ? 0 : -4}, dx, dy)],
    [C2 + 10, focus(P.bar[0], P.bar[1], d.portrait ? 1.3 : 1.5, {rx: 1, ry: d.portrait ? 0 : -3}, dx, dy)],
    [C2 + 36, focus(P.cards[0], P.cards[1] + (d.portrait ? 140 : 80), d.portrait ? 1.12 : 0.98, {rx: 4, ry: d.portrait ? 2 : -8}, dx, dy)],
    [dur, focus(P.cards[0], P.cards[1] + (d.portrait ? 160 : 100), d.portrait ? 1.15 : 1.0, {rx: 3, ry: d.portrait ? 1 : -6}, dx, dy)],
  ]);
  const px = interpolate(frame, [6, C1 - 2, C2 - 2, C2 + 30], [P.start[0], P.city[0], P.service[0], P.cards[0] + 120], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const py = interpolate(frame, [6, C1 - 2, C2 - 2, C2 + 30], [P.start[1], P.city[1], P.service[1], P.cards[1] + 180], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const show = interpolate(frame, [4, 10, C2 + 30, C2 + 40], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const m1 = interpolate(frame, [C1 + 2, C1 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const m2 = interpolate(frame, [C2 + 2, C2 + 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Frame
      captions={
        <Sequence from={6} layout="none">
          <CaptionBlock cap={caption} />
        </Sequence>
      }
    >
      <Device cam={cam}>
        <Shot name="studios" />
        <Shot name="studios-madrid" opacity={m1} />
        <Shot name="studios-madrid-ppf" opacity={m2} />
        <Pointer x={px} y={py} clicks={[C1, C2]} show={show} />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Studio card → full profile.                                          */
/* ------------------------------------------------------------------ */
const PROFILE_POS: Record<Kind, {card: [number, number, number, number]; details: [number, number]}> = {
  desktop: {card: [519, 137, 401, 628], details: [720, 560]},
  mobile: {card: [16, 108, 358, 628], details: [195, 560]},
};

export type SiteProfileProps = {caption: Caption};

export const SiteProfile: React.FC<SiteProfileProps & {dur: number}> = ({caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const {card, details} = PROFILE_POS[d.kind];
  const V = VIEW[d.kind];
  const cx = card[0] + card[2] / 2;
  const cy = card[1] + card[3] / 2;
  const CLICK = 26;
  const dx = d.portrait ? 0 : 180;
  const dy = d.portrait ? 260 : -40;
  const cam = camAt(frame, [
    [0, focus(cx, cy, d.portrait ? 1.1 : 1.0, {rx: 5, ry: d.portrait ? 3 : -10}, dx, dy)],
    [CLICK, focus(cx, cy, d.portrait ? 1.16 : 1.15, {rx: 2, ry: d.portrait ? 0 : -5}, dx, dy)],
    [CLICK + 24, focus(V.w / 2, V.h / 2, d.portrait ? 1.1 : 0.96, {rx: 3, ry: d.portrait ? 0 : -6}, dx, dy)],
    [dur, focus(details[0], details[1], d.portrait ? 1.25 : 1.3, {rx: 1, ry: d.portrait ? 0 : -3}, dx, dy)],
  ]);
  const p = interpolate(frame, [CLICK + 2, CLICK + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const clip = `inset(${card[1] * (1 - p)}px ${(V.w - card[0] - card[2]) * (1 - p)}px ${(V.h - card[1] - card[3]) * (1 - p)}px ${card[0] * (1 - p)}px round ${24 * (1 - p)}px)`;
  const px = interpolate(frame, [4, CLICK - 2], [cx + 260, cx + 10], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const py = interpolate(frame, [4, CLICK - 2], [cy + 300, cy - 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const show = interpolate(frame, [4, 10, CLICK + 4, CLICK + 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Frame
      captions={
        <Sequence from={6} layout="none">
          <CaptionBlock cap={caption} />
        </Sequence>
      }
    >
      <Device cam={cam}>
        <Shot name="studios-card" />
        {p > 0 ? <Shot name="profile" clip={clip} /> : null}
        <Pointer x={px} y={py} clicks={[CLICK]} show={show} />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Single screen with a slow camera pan ("Judge the finish").           */
/* ------------------------------------------------------------------ */
const PAN: Record<string, Record<Kind, [[number, number, number], [number, number, number]]>> = {
  films: {desktop: [[430, 520, 1.15], [1000, 560, 1.2]], mobile: [[195, 330, 1.05], [195, 560, 1.15]]},
};

export type SitePanProps = {shot: 'films'; caption: Caption};

export const SitePan: React.FC<SitePanProps & {dur: number}> = ({shot, caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const [a, b] = PAN[shot][d.kind];
  const dx = d.portrait ? 0 : 180;
  const dy = d.portrait ? 260 : -40;
  const cam = camAt(
    frame,
    [
      [0, focus(a[0], a[1], a[2], {rx: 4, ry: d.portrait ? 2 : -8}, dx, dy)],
      [dur, focus(b[0], b[1], b[2], {rx: 2, ry: d.portrait ? -1 : -3}, dx, dy)],
    ],
    Easing.inOut(Easing.quad),
  );
  return (
    <Frame
      captions={
        <Sequence from={6} layout="none">
          <CaptionBlock cap={caption} />
        </Sequence>
      }
    >
      <Device cam={cam}>
        <Shot name={shot} />
      </Device>
    </Frame>
  );
};
