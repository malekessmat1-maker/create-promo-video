import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {C, CONTACT, F, useLayout} from '../theme';
import {Eyebrow, Grain, LightSweep, LineReveal, LineSpec, Vignette} from '../components/ui';
import {CARDS_ALL, CARDS_CAIRO_PPF, CITIES, GROWTH_STOPS, GrowthPage, L, MarketPage, MarketState, ProfileModal, SERVICES, cardRect, citySelY, profileRect, svcSelY} from '../site/SiteUI';

/*
 * Website feature scenes. Everything inside the device is positioned in the
 * website's own CSS pixels (desktop viewport 1440×900, mobile 390×844), using
 * the Egypt rebuild of the Veylon site in src/site/SiteUI.tsx, so cursor
 * targets land exactly on the UI they operate.
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
          <div style={{position: 'absolute', left: 0, top: 0, width: VIEW[d.kind].w, height: VIEW[d.kind].h, transform: `scale(${d.k})`, transformOrigin: '0 0', overflow: 'hidden'}}>
            {d.portrait ? (
              <>
                <div style={{position: 'absolute', left: 0, top: STATUS_H, width: VIEW.mobile.w, height: VIEW.mobile.h - STATUS_H, overflow: 'hidden'}}>{children}</div>
                <StatusBar />
              </>
            ) : (
              children
            )}
          </div>
          <div style={{position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${40 + glare}%, rgba(255,255,255,.10) ${50 + glare}%, transparent ${60 + glare}%)`, pointerEvents: 'none'}} />
        </div>
        {d.portrait ? (
          <div style={{position: 'absolute', top: 30 * u, left: '50%', transform: 'translateX(-50%)', width: 150 * u, height: 40 * u, borderRadius: 99, background: '#000'}} />
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/** Phone status bar; mobile page content starts below it. */
const STATUS_H = 50;
const StatusBar: React.FC = () => (
  <div style={{position: 'absolute', left: 0, top: 0, width: VIEW.mobile.w, height: STATUS_H, background: '#f5f3ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 30px 0 34px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 15, color: '#070707'}}>
    <span>9:41</span>
    <span style={{display: 'flex', gap: 6, alignItems: 'center'}}>
      <svg width="17" height="11" viewBox="0 0 17 11">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 4.5} y={8 - i * 2.6} width="3" height={3 + i * 2.6} rx="0.8" fill="#070707" />
        ))}
      </svg>
      <svg width="25" height="12" viewBox="0 0 25 12">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="#070707" fill="none" opacity="0.5" />
        <rect x="2.5" y="2.5" width="15" height="7" rx="1.5" fill="#070707" />
        <rect x="22.5" y="4" width="2" height="4" rx="1" fill="#070707" opacity="0.5" />
      </svg>
    </span>
  </div>
);

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

/** The site page, scrolled. */
const Page: React.FC<{scroll: number; st?: MarketState; growth?: boolean; blur?: number}> = ({scroll, st = DEFAULT_ST, growth, blur = 0}) => {
  const {kind} = useDevice();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: VIEW[kind].w, height: VIEW[kind].h, overflow: 'hidden', background: '#f5f3ee'}}>
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translateY(${-scroll}px)`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined}}>
        {growth ? <GrowthPage m={kind} /> : <MarketPage m={kind} st={st} />}
      </div>
    </div>
  );
};

const DEFAULT_ST: MarketState = {city: 'All cities', service: 'All services', cards: CARDS_ALL};
const CAIRO_ST: MarketState = {city: 'Cairo', service: 'PPF', cards: CARDS_CAIRO_PPF};

/* ------------------------------------------------------------------ */
/* Hero reveal: starts inside the site's own headline, pulls back.      */
/* ------------------------------------------------------------------ */
const HERO_FOCUS: Record<'market' | 'growth', Record<Kind, [number, number, number]>> = {
  // [cssX, cssY, zoom] framing each page's headline
  market: {desktop: [400, 437, 1.9], mobile: [170, 294, 2.2]},
  growth: {desktop: [570, 342, 1.9], mobile: [166, 293, 2.2]},
};

export type SiteHeroProps = {page?: 'market' | 'growth'; caption?: Caption; revealAt?: number};

export const SiteHero: React.FC<SiteHeroProps & {dur: number}> = ({page = 'market', caption, revealAt = 60, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const [fx, fy, fz] = HERO_FOCUS[page][d.kind];
  const start = focus(fx, fy, fz);
  const drift = focus(fx + (d.portrait ? 0 : 40), fy + 16, fz * 1.03);
  const wideA: Cam = d.portrait ? {x: 0, y: 250 * d.u, z: 1.14, rx: 8, ry: -6, rz: 1} : {x: 150 * d.u, y: -20 * d.u, z: 1.04, rx: 7, ry: -12, rz: 0.6};
  const wideB: Cam = d.portrait ? {x: 0, y: 260 * d.u, z: 1.18, rx: 3, ry: -2, rz: 0} : {x: 190 * d.u, y: -30 * d.u, z: 1.1, rx: 3, ry: -7, rz: 0};
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
        <Page scroll={0} growth={page === 'growth'} />
      </Device>
      <LightSweep start={revealAt - 6} duration={36} opacity={0.28} width={10} />
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Scrolling through a page with captions per stop.                    */
/* ------------------------------------------------------------------ */
const SCROLL_STOPS: Record<'market' | 'growth', Record<Kind, number[]>> = {
  market: {desktop: [L.desktop.studiosTop, 1640, 3500], mobile: [1470, 2110, 4170]},
  growth: GROWTH_STOPS,
};

export type SiteScrollProps = {page: 'market' | 'growth'; captions: Caption[]; stops?: number[]};

export const SiteScroll: React.FC<SiteScrollProps & {dur: number}> = ({page, captions, stops: pick, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const all = SCROLL_STOPS[page][d.kind];
  const stops = (pick ?? all.map((_, i) => i)).map((i) => all[i]);
  const seg = Math.floor(dur / stops.length);
  const MOVE = 18;
  const keysF: number[] = [0];
  const keysY: number[] = [Math.max(0, stops[0] - 600)];
  stops.forEach((y, i) => {
    if (i > 0) {
      keysF.push(i * seg);
      keysY.push(stops[i - 1]);
    }
    keysF.push(i * seg + MOVE);
    keysY.push(y);
  });
  const ease = Easing.inOut(Easing.cubic);
  const y = interpolate(frame, keysF, keysY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const yPrev = interpolate(Math.max(0, frame - 1), keysF, keysY, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const blur = Math.min(4, Math.abs(y - yPrev) * 0.025);
  const cam = camAt(
    frame,
    d.portrait
      ? [
          [0, {x: 0, y: 260 * d.u, z: 1.14, rx: 5, ry: 3, rz: -0.6}],
          [dur, {x: 0, y: 260 * d.u, z: 1.18, rx: 2, ry: -2, rz: 0}],
        ]
      : [
          [0, {x: 200 * d.u, y: -40 * d.u, z: 1.08, rx: 5, ry: -10, rz: 0}],
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
        <Page scroll={y} growth={page === 'growth'} blur={blur} />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Live filtering: City → Cairo, Treatment → PPF, with real dropdowns. */
/* ------------------------------------------------------------------ */
const FILTER_SCROLL: Record<Kind, number> = {desktop: L.desktop.studiosTop, mobile: 1700};

export type SiteFilterProps = {caption: Caption};

export const SiteFilter: React.FC<SiteFilterProps & {dur: number}> = ({caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const m = d.kind;
  const lay = L[m];
  const sc = FILTER_SCROLL[m];
  const opt = (selY: number, i: number) => selY + 66 + i * 42 + 21 - sc;
  const city: [number, number] = [lay.citySel.x + lay.citySel.w / 2, citySelY(m) + 27 - sc];
  const svc: [number, number] = [lay.svcSel.x + lay.svcSel.w / 2, svcSelY(m) + 27 - sc];
  const cairo: [number, number] = [lay.citySel.x + 90, opt(citySelY(m), CITIES.indexOf('Cairo'))];
  const ppf: [number, number] = [lay.svcSel.x + 90, opt(svcSelY(m), SERVICES.indexOf('PPF'))];
  const cards: [number, number] = [m === 'desktop' ? 720 : 195, lay.gridY - sc + (m === 'desktop' ? 230 : 260)];
  const bar: [number, number] = m === 'desktop' ? [1000, city[1] + 90] : [195, (city[1] + svc[1]) / 2 + 90];

  // timeline
  const OPEN1 = 22;
  const PICK1 = 40;
  const OPEN2 = 60;
  const PICK2 = 78;
  const st: MarketState = {
    city: frame >= PICK1 ? 'Cairo' : 'All cities',
    service: frame >= PICK2 ? 'PPF' : 'All services',
    open: frame >= OPEN1 && frame < PICK1 ? 'city' : frame >= OPEN2 && frame < PICK2 ? 'service' : null,
    hover: frame >= OPEN1 && frame < PICK1 ? (frame >= OPEN1 + 8 ? 'Cairo' : 'All cities') : frame >= OPEN2 + 8 ? 'PPF' : 'All services',
    cards: frame >= PICK1 ? CARDS_CAIRO_PPF : CARDS_ALL,
    cardsIn: frame >= PICK1 ? interpolate(frame, [PICK1 + 2, PICK1 + 20], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1,
  };
  const keys: [number, [number, number]][] = [
    [0, [cards[0] + 300, cards[1] + 200]],
    [OPEN1 - 2, city],
    [PICK1 - 3, cairo],
    [OPEN2 - 2, svc],
    [PICK2 - 3, ppf],
    [PICK2 + 22, [cards[0] + 160, cards[1] + 60]],
  ];
  const kf = keys.map((k) => k[0]);
  const eio = Easing.inOut(Easing.cubic);
  const px = interpolate(frame, kf, keys.map((k) => k[1][0]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: eio});
  const py = interpolate(frame, kf, keys.map((k) => k[1][1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: eio});
  const show = interpolate(frame, [2, 8, PICK2 + 18, PICK2 + 26], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const dx = d.portrait ? 0 : 180;
  const dy = d.portrait ? 260 : -40;
  const zBar = d.portrait ? 1.3 : 1.42;
  const cam = camAt(frame, [
    [0, focus(cards[0], cards[1] - 120, d.portrait ? 1.1 : 0.96, {rx: 5, ry: d.portrait ? 2 : -9}, dx, dy)],
    [OPEN1 - 4, focus(bar[0], bar[1], zBar, {rx: 2, ry: d.portrait ? 0 : -4}, dx, dy)],
    [PICK2 + 4, focus(bar[0], bar[1] + 10, zBar + 0.04, {rx: 1, ry: d.portrait ? 0 : -3}, dx, dy)],
    [PICK2 + 30, focus(cards[0], cards[1], d.portrait ? 1.12 : 1.0, {rx: 3, ry: d.portrait ? 1 : -6}, dx, dy)],
    [dur, focus(cards[0], cards[1] + 20, d.portrait ? 1.15 : 1.03, {rx: 2, ry: d.portrait ? 0 : -5}, dx, dy)],
  ]);
  return (
    <Frame
      captions={
        <Sequence from={6} layout="none">
          <CaptionBlock cap={caption} />
        </Sequence>
      }
    >
      <Device cam={cam}>
        <Page scroll={sc} st={st} />
        <Pointer x={px} y={py} clicks={[OPEN1, PICK1, OPEN2, PICK2]} show={show} />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* Studio card → full profile.                                          */
/* ------------------------------------------------------------------ */
const PROFILE_SCROLL: Record<Kind, number> = {desktop: 1600, mobile: 2100};

export type SiteProfileProps = {caption: Caption};

export const SiteProfile: React.FC<SiteProfileProps & {dur: number}> = ({caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const m = d.kind;
  const V = VIEW[m];
  const sc = PROFILE_SCROLL[m];
  const c = cardRect(m, 0);
  const card = {x: c.x, y: c.y - sc, w: c.w, h: c.h};
  const r = profileRect(m);
  const cx = card.x + card.w / 2;
  const cy = card.y + card.h / 2;
  const CLICK = 26;
  const dx = d.portrait ? 0 : 180;
  const dy = d.portrait ? 260 : -40;
  const details: [number, number] = m === 'desktop' ? [720, 600] : [195, 560];
  const cam = camAt(frame, [
    [0, focus(cx, cy, d.portrait ? 1.1 : 1.0, {rx: 5, ry: d.portrait ? 2 : -9}, dx, dy)],
    [CLICK, focus(cx, cy, d.portrait ? 1.16 : 1.12, {rx: 2, ry: d.portrait ? 0 : -5}, dx, dy)],
    [CLICK + 24, focus(V.w / 2, V.h / 2, d.portrait ? 1.1 : 0.98, {rx: 3, ry: d.portrait ? 0 : -6}, dx, dy)],
    [dur, focus(details[0], details[1], d.portrait ? 1.22 : 1.25, {rx: 1, ry: d.portrait ? 0 : -3}, dx, dy)],
  ]);
  const p = interpolate(frame, [CLICK + 2, CLICK + 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const top = lerp(card.y, r.y);
  const left = lerp(card.x, r.x);
  const right = lerp(V.w - card.x - card.w, V.w - r.x - r.w);
  const bottom = lerp(V.h - card.y - card.h, V.h - r.y - r.h);
  const clip = `inset(${top}px ${right}px ${bottom}px ${left}px round ${lerp(22, 30)}px)`;
  const px = interpolate(frame, [2, CLICK - 2], [cx + 280, cx + 20], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const py = interpolate(frame, [2, CLICK - 2], [cy + 320, cy - 60], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const show = interpolate(frame, [2, 8, CLICK + 4, CLICK + 10], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <Frame
      captions={
        <Sequence from={6} layout="none">
          <CaptionBlock cap={caption} />
        </Sequence>
      }
    >
      <Device cam={cam}>
        <Page scroll={sc} st={CAIRO_ST} />
        {p > 0 ? (
          <>
            <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.55 * p})`}} />
            <div style={{position: 'absolute', inset: 0, clipPath: clip}}>
              <ProfileModal m={m} />
            </div>
          </>
        ) : null}
        <Pointer x={px} y={py} clicks={[CLICK]} show={show} />
      </Device>
    </Frame>
  );
};

/* ------------------------------------------------------------------ */
/* "Judge the finish" section with a slow pan.                          */
/* ------------------------------------------------------------------ */
const PAN: Record<Kind, {scroll: number; a: [number, number, number]; b: [number, number, number]}> = {
  desktop: {scroll: 3500, a: [430, 520, 1.12], b: [1000, 560, 1.18]},
  mobile: {scroll: 4170, a: [195, 330, 1.05], b: [195, 560, 1.15]},
};

export type SitePanProps = {caption: Caption};

export const SitePan: React.FC<SitePanProps & {dur: number}> = ({caption, dur}) => {
  const frame = useCurrentFrame();
  const d = useDevice();
  const focus = useFocus();
  const {scroll, a, b} = PAN[d.kind];
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
        <Page scroll={scroll} />
      </Device>
    </Frame>
  );
};
