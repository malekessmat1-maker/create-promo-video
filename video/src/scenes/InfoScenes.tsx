import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, F, useLayout} from '../theme';
import {Body, CornerMark, Eyebrow, Flash, Grain, LightSweep, LineReveal, LineSpec, Photo, PhotoSpec, Stage, useSpring, Vignette} from '../components/ui';

const Backdrop: React.FC<{photo?: PhotoSpec; dur: number; opacity?: number}> = ({photo, dur, opacity = 0.22}) => (
  <>
    <AbsoluteFill style={{backgroundColor: C.ink}} />
    {photo ? (
      <AbsoluteFill style={{opacity}}>
        <Photo photo={photo} dur={dur} brightness={0.55} orangeWash={false} />
      </AbsoluteFill>
    ) : null}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 80% 20%, rgba(255,90,31,.16), transparent 55%)'}} />
  </>
);

/* ------------------------------------------------------------------ */
/* Stats: four proof points from the site.                              */
/* ------------------------------------------------------------------ */
export type StatsProps = {eyebrow: string; title: LineSpec[]; items: {value: number; prefix?: string; suffix?: string; label: string}[]; photo?: PhotoSpec};

export const Stats: React.FC<StatsProps & {dur: number}> = ({eyebrow, title, items, photo, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u, portrait} = useLayout();
  return (
    <AbsoluteFill>
      <Backdrop photo={photo} dur={dur} />
      <Stage align="center">
        <div style={{display: 'flex', flexDirection: 'column', gap: 34 * u, width: '100%'}}>
          <Eyebrow text={eyebrow} size={24 * u} delay={2} />
          <LineReveal lines={title} size={(portrait ? 84 : 92) * u} delay={6} fitWidth={(portrait ? 920 : 1640) * u} />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: portrait ? '1fr 1fr' : 'repeat(4, 1fr)',
              gap: (portrait ? 28 : 30) * u,
              marginTop: 30 * u,
            }}
          >
            {items.map((it, i) => {
              const d = 24 + i * 12;
              const s = spring({frame: frame - d, fps, config: {damping: 200}, durationInFrames: 22});
              const v = interpolate(frame, [d, d + 36], [0, it.value], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
              return (
                <div
                  key={i}
                  style={{
                    opacity: s,
                    transform: `translateY(${(1 - s) * 40}px)`,
                    borderTop: `3px solid ${C.orange}`,
                    background: 'rgba(16,16,16,.78)',
                    padding: `${30 * u}px ${30 * u}px ${34 * u}px`,
                    borderRadius: `0 0 ${20 * u}px ${20 * u}px`,
                  }}
                >
                  <div style={{fontFamily: F.display, fontWeight: 700, fontSize: (portrait ? 150 : 150) * u, lineHeight: 1, color: C.paper, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums'}}>
                    {it.prefix ?? ''}
                    {Math.round(v)}
                    {it.suffix ? <span style={{color: C.orange}}>{it.suffix}</span> : null}
                  </div>
                  <div style={{fontFamily: F.body, fontWeight: 500, fontSize: (portrait ? 30 : 28) * u, color: C.muted, marginTop: 14 * u, lineHeight: 1.35}}>{it.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </Stage>
      <CornerMark />
      <Grain />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Marketplace filter demo.                                            */
/* ------------------------------------------------------------------ */
type Card = {img: string; place: string; specialty: string; tags: string[]};

// Real entries from the Veylon marketplace (specialty + locality, studio names omitted).
const ALL_CARDS: Card[] = [
  {img: 'porsche-road.jpg', place: 'Vilanova i la Geltrú · Barcelona', specialty: 'Luxury and sports-car protection', tags: ['PPF', 'Ceramic', 'Detailing', 'Wrap']},
  {img: 'amg-gtr.jpg', place: 'Alicante', specialty: 'High-end paint preservation', tags: ['PPF', 'Ceramic', 'Detailing', 'Tint', 'Wrap']},
  {img: 'mclaren.jpg', place: 'San Pedro de Alcántara · Marbella', specialty: 'Luxury finish and PPF', tags: ['PPF', 'Ceramic', 'Detailing', 'Tint', 'Wrap']},
  {img: 'bmw-m5.jpg', place: 'Valencia', specialty: 'Detailing and ceramic protection', tags: ['PPF', 'Ceramic', 'Detailing']},
];
const MADRID_CARDS: Card[] = [
  {img: 'range-rover.jpg', place: 'Las Rozas · Madrid', specialty: 'Premium protection and restoration', tags: ['PPF', 'Ceramic', 'Detailing', 'Wrap']},
  {img: 'audi-r8.jpg', place: 'San Sebastián de los Reyes · Madrid', specialty: 'Protection, wrapping and performance', tags: ['PPF', 'Ceramic', 'Detailing', 'Tint', 'Wrap']},
  {img: 'amg-red.jpg', place: 'Arganda del Rey · Madrid', specialty: 'Paint protection and correction', tags: ['PPF', 'Ceramic', 'Detailing']},
  {img: 'merc-neon.jpg', place: 'Mirasierra · Madrid', specialty: 'Complete vehicle care and customisation', tags: ['PPF', 'Ceramic', 'Detailing', 'Wrap']},
];
const CITIES = ['All cities', 'Madrid', 'Barcelona', 'Marbella', 'Alicante', 'Valencia'];
const SERVICES = ['All services', 'PPF', 'Ceramic', 'Detailing', 'Window tint', 'Wrapping'];

const Chip: React.FC<{label: string; active: boolean; u: number; size: number; pressed?: number}> = ({label, active, u, size, pressed = 0}) => (
  <div
    style={{
      padding: `${size * 0.42}px ${size * 0.9}px`,
      borderRadius: 999,
      border: `${1.5 * u}px solid ${active ? C.orange : C.line}`,
      background: active ? C.orange : 'rgba(23,23,23,.9)',
      color: active ? '#140600' : C.paper,
      fontFamily: F.body,
      fontWeight: 600,
      fontSize: size,
      whiteSpace: 'nowrap',
      transform: `scale(${1 - pressed * 0.08})`,
    }}
  >
    {label}
  </div>
);

export type FilterDemoProps = {eyebrow: string; title: LineSpec[]; body?: string};

export const FilterDemo: React.FC<FilterDemoProps & {dur: number}> = ({eyebrow, title, body, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u, portrait} = useLayout();
  const CLICK_CITY = 62;
  const CLICK_SVC = 108;
  const cityActive = frame >= CLICK_CITY ? 1 : 0;
  const svcActive = frame >= CLICK_SVC ? 1 : 0;
  const cards = frame >= CLICK_CITY + 2 ? MADRID_CARDS : ALL_CARDS;
  const shown = portrait ? cards.slice(0, 2) : cards.slice(0, 3);
  const panelIn = spring({frame: frame - 6, fps, config: {damping: 200}, durationInFrames: 26});
  const chipSize = (portrait ? 24 : 20) * u;

  // Cursor path: start → Madrid chip → PPF chip → rest over first card.
  const cursorKeys = portrait
    ? {x: [760, 300, 190, 420], y: [900, 280, 360, 700]}
    : {x: [1150, 330, 225, 520], y: [700, 150, 222, 520]};
  const cx = interpolate(frame, [20, CLICK_CITY - 4, CLICK_SVC - 4, CLICK_SVC + 30], cursorKeys.x, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const cy = interpolate(frame, [20, CLICK_CITY - 4, CLICK_SVC - 4, CLICK_SVC + 30], cursorKeys.y, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const pressCity = interpolate(frame, [CLICK_CITY - 3, CLICK_CITY, CLICK_CITY + 4], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const pressSvc = interpolate(frame, [CLICK_SVC - 3, CLICK_SVC, CLICK_SVC + 4], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const count = frame >= CLICK_CITY ? 5 : 15;
  const swap = (at: number) => spring({frame: frame - at, fps, config: {damping: 200}, durationInFrames: 18});
  const cardAnim = frame >= CLICK_CITY + 2 ? swap(CLICK_CITY + 2) : swap(14);

  const panelW = portrait ? 940 * u : 1080 * u;
  const panel = (
    <div
      style={{
        width: panelW,
        background: 'rgba(16,16,16,.96)',
        border: `${1.5 * u}px solid ${C.line}`,
        borderRadius: 26 * u,
        padding: 30 * u,
        position: 'relative',
        opacity: panelIn,
        transform: `translateY(${(1 - panelIn) * 60}px)`,
        boxShadow: '0 40px 120px rgba(0,0,0,.6)',
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 * u}}>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 18 * u, letterSpacing: '0.16em', color: C.orange}}>THE VEYLON SHORTLIST</div>
        <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 34 * u, color: C.paper}}>
          {count}
          <span style={{color: C.muted}}>/15</span>
        </div>
      </div>
      <div style={{display: 'flex', gap: 10 * u, flexWrap: 'wrap', marginBottom: 12 * u}}>
        {CITIES.map((c) => (
          <Chip key={c} label={c} u={u} size={chipSize} active={c === 'Madrid' ? cityActive === 1 : c === 'All cities' ? cityActive === 0 : false} pressed={c === 'Madrid' ? pressCity : 0} />
        ))}
      </div>
      <div style={{display: 'flex', gap: 10 * u, flexWrap: 'wrap', marginBottom: 26 * u}}>
        {SERVICES.map((c) => (
          <Chip key={c} label={c} u={u} size={chipSize} active={c === 'PPF' ? svcActive === 1 : c === 'All services' ? svcActive === 0 : false} pressed={c === 'PPF' ? pressSvc : 0} />
        ))}
      </div>
      <div style={{display: 'grid', gridTemplateColumns: portrait ? '1fr 1fr' : '1fr 1fr 1fr', gap: 18 * u}}>
        {shown.map((c, i) => {
          const a = Math.max(0, Math.min(1, cardAnim * 1.4 - i * 0.2));
          const highlight = svcActive ? 1 : 0;
          return (
            <div
              key={c.place}
              style={{
                borderRadius: 18 * u,
                overflow: 'hidden',
                background: C.soft,
                border: `${1.5 * u}px solid ${C.line}`,
                opacity: a,
                transform: `translateY(${(1 - a) * 30}px)`,
              }}
            >
              <div style={{height: (portrait ? 230 : 200) * u, overflow: 'hidden'}}>
                <Img src={staticFile(`img/${c.img}`)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.8) contrast(1.1) brightness(.85)'}} />
              </div>
              <div style={{padding: 18 * u}}>
                <div style={{fontFamily: F.body, fontSize: 16 * u, color: C.muted, marginBottom: 8 * u, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{c.place}</div>
                <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 26 * u, color: C.paper, textTransform: 'uppercase', lineHeight: 1.05, minHeight: 56 * u}}>{c.specialty}</div>
                <div style={{display: 'flex', gap: 6 * u, flexWrap: 'wrap', marginTop: 12 * u}}>
                  {c.tags.map((t) => (
                    <div
                      key={t}
                      style={{
                        fontFamily: F.body,
                        fontSize: 14 * u,
                        fontWeight: 600,
                        padding: `${4 * u}px ${10 * u}px`,
                        borderRadius: 999,
                        background: t === 'PPF' && highlight ? C.orange : '#222',
                        color: t === 'PPF' && highlight ? '#140600' : C.muted,
                      }}
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* cursor */}
      <svg width={34 * u} height={44 * u} viewBox="0 0 34 44" style={{position: 'absolute', left: cx * u, top: cy * u, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,.6))', opacity: interpolate(frame, [14, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        <path d="M2 2 L2 36 L11 27 L17 41 L23 38 L17 25 L30 25 Z" fill={C.paper} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    </div>
  );

  return (
    <AbsoluteFill>
      <Backdrop photo={{src: 'garage-camaro.jpg'}} dur={dur} opacity={0.25} />
      <AbsoluteFill
        style={{
          padding: portrait ? `${230 * u}px ${70 * u}px ${300 * u}px` : `${100 * u}px ${110 * u}px`,
          flexDirection: portrait ? 'column' : 'row',
          alignItems: portrait ? 'flex-start' : 'center',
          justifyContent: portrait ? 'flex-start' : 'space-between',
          gap: portrait ? 50 * u : 60 * u,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 26 * u, width: portrait ? '100%' : 600 * u}}>
          <Eyebrow text={eyebrow} size={22 * u} delay={2} />
          <LineReveal lines={title} size={(portrait ? 80 : 72) * u} delay={6} fitWidth={(portrait ? 920 : 600) * u} />
          {body ? <Body text={body} size={(portrait ? 32 : 28) * u} delay={20} maxWidth={portrait ? 900 * u : 560 * u} /> : null}
        </div>
        {panel}
      </AbsoluteFill>
      <Grain />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Numbered steps (how it works / growth pillars).                     */
/* ------------------------------------------------------------------ */
export type StepsProps = {eyebrow: string; title: LineSpec[]; steps: {title: string; text: string}[]; photo?: PhotoSpec; gap?: number};

export const Steps: React.FC<StepsProps & {dur: number}> = ({eyebrow, title, steps, photo, dur, gap}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u, portrait} = useLayout();
  const n = steps.length;
  const every = gap ?? Math.floor((dur - 70) / n);
  const four = n === 4;
  const cols = portrait ? 1 : four ? 2 : 3;
  const active = Math.min(n - 1, Math.max(0, Math.floor((frame - 30) / every)));
  return (
    <AbsoluteFill>
      <Backdrop photo={photo} dur={dur} opacity={0.2} />
      <Stage align="center">
        <div style={{display: 'flex', flexDirection: 'column', gap: 30 * u, width: '100%'}}>
          <Eyebrow text={eyebrow} size={24 * u} delay={2} />
          <LineReveal lines={title} size={(portrait ? 80 : four ? 78 : 92) * u} delay={6} fitWidth={(portrait ? 920 : 1640) * u} />
          <div style={{display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: (portrait ? 22 : 26) * u, marginTop: 24 * u}}>
            {steps.map((st, i) => {
              const d = 30 + i * every;
              const s = spring({frame: frame - d, fps, config: {damping: 200}, durationInFrames: 22});
              const isActive = i === active && frame >= 30;
              return (
                <div
                  key={i}
                  style={{
                    opacity: interpolate(s, [0, 1], [0, 1]),
                    transform: `translateY(${(1 - s) * 40}px)`,
                    background: isActive ? 'rgba(255,90,31,.10)' : 'rgba(16,16,16,.82)',
                    border: `${1.5 * u}px solid ${isActive ? C.orange : C.line}`,
                    borderRadius: 22 * u,
                    padding: (portrait ? 30 : four ? 30 : 38) * u,
                    display: 'flex',
                    flexDirection: portrait ? 'row' : 'column',
                    gap: (portrait ? 28 : 18) * u,
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{fontFamily: F.display, fontWeight: 600, fontSize: (portrait ? 64 : four ? 54 : 72) * u, color: C.orange, lineHeight: 1}}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 12 * u}}>
                    <div style={{fontFamily: F.display, fontWeight: 600, fontSize: (portrait ? 44 : four ? 40 : 48) * u, color: C.paper, textTransform: 'uppercase', lineHeight: 1.02}}>{st.title}</div>
                    <div style={{fontFamily: F.body, fontSize: (portrait ? 27 : four ? 23 : 26) * u, color: C.muted, lineHeight: 1.45}}>{st.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Stage>
      <CornerMark />
      <Grain />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Services montage: hard cuts on the beat.                            */
/* ------------------------------------------------------------------ */
export type ServicesProps = {items: {label: string; photo: PhotoSpec}[]; eyebrow: string};

export const Services: React.FC<ServicesProps & {dur: number}> = ({items, eyebrow, dur}) => {
  const {u, portrait} = useLayout();
  const each = Math.floor(dur / items.length);
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      {items.map((it, i) => (
        <Sequence key={i} from={i * each} durationInFrames={i === items.length - 1 ? dur - i * each : each}>
          <ServiceShot label={it.label} photo={it.photo} index={i} total={items.length} dur={each} eyebrow={eyebrow} u={u} portrait={portrait} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const ServiceShot: React.FC<{label: string; photo: PhotoSpec; index: number; total: number; dur: number; eyebrow: string; u: number; portrait: boolean}> = ({
  label,
  photo,
  index,
  total,
  dur,
  eyebrow,
  u,
  portrait,
}) => {
  const frame = useCurrentFrame();
  const s = useSpring(0, 200, 12);
  const track = interpolate(frame, [0, dur], [0.02, -0.01]);
  return (
    <AbsoluteFill>
      <Photo photo={photo} dur={dur} zoom={[1.18, 1.08]} drift={60} brightness={0.62} />
      <Stage>
        <div style={{display: 'flex', flexDirection: 'column', gap: 20 * u}}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 24 * u, letterSpacing: '0.16em', color: C.orange, textTransform: 'uppercase'}}>
            {eyebrow} · {String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}
          </div>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 700,
              fontSize: (portrait ? (label.length > 8 ? 150 : 190) : 230) * u,
              lineHeight: 0.9,
              color: C.paper,
              textTransform: 'uppercase',
              letterSpacing: `${track}em`,
              opacity: s,
              transform: `translateX(${(1 - s) * -40}px)`,
            }}
          >
            {label}
          </div>
        </div>
      </Stage>
      <Flash at={0} color={C.paper} peak={0.18} length={5} />
      <CornerMark />
      <Grain />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* City roll.                                                           */
/* ------------------------------------------------------------------ */
export type CityRollProps = {eyebrow: string; cities: string[]; photo: PhotoSpec; footer?: string};

export const CityRoll: React.FC<CityRollProps & {dur: number}> = ({eyebrow, cities, photo, footer, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const step = Math.floor((dur - 40) / cities.length);
  const pos = interpolate(frame, [16, 16 + step * (cities.length - 1)], [0, cities.length - 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const rowH = (portrait ? 150 : 170) * u;
  const fs = (portrait ? 128 : 150) * u;
  return (
    <AbsoluteFill>
      <Photo photo={photo} dur={dur} brightness={0.5} />
      <Stage align="center">
        <div style={{display: 'flex', flexDirection: 'column', gap: 30 * u, width: '100%'}}>
          <Eyebrow text={eyebrow} size={24 * u} delay={2} />
          <div style={{position: 'relative', height: rowH * 3, overflow: 'hidden', maskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)', WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)'}}>
            {cities.map((c, i) => {
              const off = i - pos;
              const dist = Math.min(1, Math.abs(off));
              return (
                <div
                  key={c}
                  style={{
                    position: 'absolute',
                    top: rowH + off * rowH,
                    height: rowH,
                    display: 'flex',
                    alignItems: 'center',
                    fontFamily: F.display,
                    fontWeight: 700,
                    fontSize: fs,
                    lineHeight: 1,
                    textTransform: 'uppercase',
                    color: dist < 0.5 ? C.orange : C.paper,
                    opacity: 1 - dist * 0.65,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>
          {footer ? <Body text={footer} size={(portrait ? 34 : 32) * u} delay={20} /> : null}
        </div>
      </Stage>
      <CornerMark />
      <Grain />
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Before / after website concept.                                     */
/* ------------------------------------------------------------------ */
export type BeforeAfterProps = {eyebrow: string; title: LineSpec[]; body?: string};

const Browser: React.FC<{u: number; w: number; h: number; children: React.ReactNode}> = ({u, w, h, children}) => (
  <div style={{width: w, height: h, borderRadius: 18 * u, overflow: 'hidden', border: `${1.5 * u}px solid ${C.line}`, background: '#0c0c0c', boxShadow: '0 40px 120px rgba(0,0,0,.6)', position: 'relative'}}>
    <div style={{height: 44 * u, display: 'flex', alignItems: 'center', gap: 9 * u, padding: `0 ${18 * u}px`, background: '#151515', borderBottom: `${1 * u}px solid ${C.line}`}}>
      {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
        <div key={c} style={{width: 13 * u, height: 13 * u, borderRadius: 99, background: c, opacity: 0.8}} />
      ))}
    </div>
    <div style={{position: 'absolute', top: 44 * u, left: 0, right: 0, bottom: 0}}>{children}</div>
  </div>
);

export const BeforeAfter: React.FC<BeforeAfterProps & {dur: number}> = ({eyebrow, title, body, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const wipe = interpolate(frame, [60, 110], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const inS = useSpring(10, 200, 24);
  const w = portrait ? 940 * u : 1000 * u;
  const h = portrait ? 700 * u : 620 * u;
  const before = (
    <div style={{position: 'absolute', inset: 0, background: '#f1f1f1', padding: 44 * u, fontFamily: 'Arial, sans-serif'}}>
      <div style={{fontSize: 34 * u, fontWeight: 700, color: '#24517c'}}>AUTO DETAILING CENTER</div>
      <div style={{height: 3 * u, background: '#24517c', margin: `${16 * u}px 0 ${30 * u}px`, width: '100%'}} />
      <div style={{fontSize: 26 * u, color: '#333', lineHeight: 1.5}}>We offer detailing, washing, PPF and ceramic coating. Call us for pricing.</div>
      <div style={{display: 'flex', gap: 16 * u, marginTop: 34 * u}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{flex: 1, height: 150 * u, background: '#d4d4d4', border: `${2 * u}px solid #bbb`}} />
        ))}
      </div>
    </div>
  );
  const after = (
    <div style={{position: 'absolute', inset: 0, background: C.ink}}>
      <Img src={staticFile('img/amg-gtr.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.75) contrast(1.1) brightness(.55)'}} />
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(7,7,7,.9), rgba(7,7,7,.2))'}} />
      <div style={{position: 'absolute', left: 50 * u, top: 60 * u, right: 50 * u, display: 'flex', flexDirection: 'column', gap: 18 * u}}>
        <div style={{fontFamily: F.body, fontWeight: 700, fontSize: 18 * u, letterSpacing: '0.16em', color: C.orange}}>VEYLON CONCEPT</div>
        <div style={{fontFamily: F.display, fontWeight: 600, fontSize: 76 * u, lineHeight: 0.95, color: C.paper, textTransform: 'uppercase', maxWidth: 620 * u}}>Protection without compromise.</div>
        <div style={{fontFamily: F.body, fontSize: 22 * u, color: '#c9c9c4', maxWidth: 560 * u, lineHeight: 1.45}}>Service proof, premium positioning and a direct path to a qualified consultation.</div>
        <div style={{alignSelf: 'flex-start', marginTop: 10 * u, background: C.orange, color: '#140600', fontFamily: F.body, fontWeight: 700, fontSize: 22 * u, padding: `${16 * u}px ${28 * u}px`, borderRadius: 999}}>Book a consultation</div>
      </div>
    </div>
  );
  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: F.body,
    fontWeight: 700,
    fontSize: 20 * u,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    padding: `${10 * u}px ${18 * u}px`,
    borderRadius: 999,
    background: active ? C.orange : '#1b1b1b',
    color: active ? '#140600' : C.muted,
  });
  return (
    <AbsoluteFill>
      <Backdrop dur={dur} />
      <AbsoluteFill
        style={{
          padding: portrait ? `${230 * u}px ${70 * u}px ${300 * u}px` : `${100 * u}px ${110 * u}px`,
          flexDirection: portrait ? 'column' : 'row',
          alignItems: portrait ? 'flex-start' : 'center',
          justifyContent: portrait ? 'center' : 'space-between',
          gap: (portrait ? 70 : 50) * u,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 26 * u, width: portrait ? '100%' : 640 * u}}>
          <Eyebrow text={eyebrow} size={22 * u} delay={2} />
          <LineReveal lines={title} size={(portrait ? 78 : 80) * u} delay={6} fitWidth={(portrait ? 920 : 640) * u} />
          {body ? <Body text={body} size={(portrait ? 30 : 28) * u} delay={24} maxWidth={portrait ? 920 * u : 600 * u} /> : null}
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 18 * u, opacity: inS, transform: `translateY(${(1 - inS) * 50}px)`}}>
          <div style={{display: 'flex', gap: 12 * u}}>
            <div style={labelStyle(wipe < 0.5)}>Before</div>
            <div style={labelStyle(wipe >= 0.5)}>After · Veylon concept</div>
          </div>
          <Browser u={u} w={w} h={h}>
            {before}
            <div style={{position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)`}}>{after}</div>
            {wipe > 0 && wipe < 1 ? <div style={{position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 4 * u, background: C.orange, boxShadow: `0 0 ${30 * u}px ${C.orange}`}} /> : null}
          </Browser>
        </div>
      </AbsoluteFill>
      <Grain />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Search demo.                                                         */
/* ------------------------------------------------------------------ */
export type SearchDemoProps = {eyebrow: string; title: LineSpec[]; body?: string; query: string};

export const SearchDemo: React.FC<SearchDemoProps & {dur: number}> = ({eyebrow, title, body, query, dur}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {u, portrait} = useLayout();
  const typed = Math.floor(interpolate(frame, [24, 24 + query.length * 1.6], [0, query.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const doneAt = 24 + Math.ceil(query.length * 1.6) + 8;
  const caret = Math.floor(frame / 8) % 2 === 0 && frame < doneAt + 10;
  const r1 = spring({frame: frame - doneAt, fps, config: {damping: 200}, durationInFrames: 20});
  const r2 = spring({frame: frame - doneAt - 8, fps, config: {damping: 200}, durationInFrames: 20});
  const inS = useSpring(10, 200, 24);
  const w = portrait ? 940 * u : 1000 * u;
  return (
    <AbsoluteFill>
      <Backdrop dur={dur} />
      <AbsoluteFill
        style={{
          padding: portrait ? `${230 * u}px ${70 * u}px ${300 * u}px` : `${100 * u}px ${110 * u}px`,
          flexDirection: portrait ? 'column' : 'row',
          alignItems: portrait ? 'flex-start' : 'center',
          justifyContent: portrait ? 'center' : 'space-between',
          gap: (portrait ? 70 : 50) * u,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 26 * u, width: portrait ? '100%' : 640 * u}}>
          <Eyebrow text={eyebrow} size={22 * u} delay={2} />
          <LineReveal lines={title} size={(portrait ? 76 : 76) * u} delay={6} fitWidth={(portrait ? 920 : 640) * u} />
          {body ? <Body text={body} size={(portrait ? 30 : 28) * u} delay={24} maxWidth={portrait ? 920 * u : 600 * u} /> : null}
        </div>
        <div style={{width: w, display: 'flex', flexDirection: 'column', gap: 22 * u, opacity: inS, transform: `translateY(${(1 - inS) * 50}px)`}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 18 * u, background: C.paper, borderRadius: 999, padding: `${24 * u}px ${34 * u}px`, boxShadow: '0 30px 90px rgba(0,0,0,.5)'}}>
            <svg width={30 * u} height={30 * u} viewBox="0 0 24 24">
              <circle cx="10" cy="10" r="7" stroke="#555" strokeWidth="2.4" fill="none" />
              <path d="M15.5 15.5 L22 22" stroke="#555" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <div style={{fontFamily: F.body, fontSize: 32 * u, color: '#111', fontWeight: 500}}>
              {query.slice(0, typed)}
              <span style={{opacity: caret ? 1 : 0, color: C.orange}}>|</span>
            </div>
          </div>
          <div style={{background: 'rgba(16,16,16,.95)', border: `${1.5 * u}px solid ${C.orange}`, borderRadius: 20 * u, padding: 32 * u, opacity: r1, transform: `translateY(${(1 - r1) * 30}px)`, boxShadow: `0 0 ${60 * u}px rgba(255,90,31,.25)`}}>
            <div style={{fontFamily: F.body, fontSize: 20 * u, color: C.muted}}>Your studio › ppf</div>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 34 * u, color: C.orange, margin: `${10 * u}px 0`}}>Premium PPF installation · Request a consultation</div>
            <div style={{fontFamily: F.body, fontSize: 24 * u, color: '#c9c9c4', lineHeight: 1.45}}>Certified protection, documented workmanship and a clear path to pricing.</div>
          </div>
          <div style={{background: 'rgba(16,16,16,.7)', border: `${1.5 * u}px solid ${C.line}`, borderRadius: 20 * u, padding: 32 * u, opacity: r2 * 0.55, transform: `translateY(${(1 - r2) * 30}px)`}}>
            <div style={{fontFamily: F.body, fontSize: 20 * u, color: C.muted}}>directory › local</div>
            <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 30 * u, color: C.paper, margin: `${10 * u}px 0`}}>Automotive protection services</div>
            <div style={{fontFamily: F.body, fontSize: 24 * u, color: C.muted}}>General listings and nearby options.</div>
          </div>
        </div>
      </AbsoluteFill>
      <Grain />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};
