import React from 'react';
import {Img, staticFile} from 'remotion';

/*
 * An Egypt-localised rebuild of veylonauto.vercel.app's design (light theme),
 * drawn in the site's own CSS pixels: desktop 1440 wide, mobile 390 wide.
 * Every section sits at a fixed y so camera moves and cursor targets are exact.
 * Studio cards are illustrative: they show specialty + area, never invented
 * business names, ratings or prices.
 */

export const S = {
  paper: '#f5f3ee',
  white: '#ffffff',
  ink: '#070707',
  text: '#1b1b1a',
  muted: '#5c5c57',
  faint: '#8a8a84',
  line: '#dedbd3',
  orange: '#ff5a1f',
  dark: '#0d0d0d',
};
const OSW = 'Oswald, sans-serif';
const INT = 'Inter, sans-serif';

export const CITIES = ['All cities', 'Cairo', 'Alexandria', 'Giza', 'Sheikh Zayed', '6th of October', 'Mansoura'];
export const SERVICES = ['All services', 'PPF', 'Ceramic', 'Detailing', 'Window tint', 'Wrapping'];

export type Card = {img: string; area: string; title: string; specialty: string; services: string[]};

export const CARDS_ALL: Card[] = [
  {img: 'lux-dark-sports.jpg', area: 'New Cairo · Cairo', title: 'PPF & ceramic studio', specialty: 'Full-body paint protection film', services: ['PPF', 'Ceramic', 'Detailing']},
  {img: 'det-gloves-c.jpg', area: 'Smouha · Alexandria', title: 'Detailing & correction', specialty: 'Paint correction and gloss restoration', services: ['Ceramic', 'Detailing', 'Tint']},
  {img: 'lux-orange.jpg', area: 'Sheikh Zayed', title: 'Protection & wraps', specialty: 'Colour PPF and full wraps', services: ['PPF', 'Tint', 'Wrap']},
  {img: 'det-foam.jpg', area: 'Mansoura', title: 'Ceramic specialist', specialty: 'Multi-layer ceramic coatings', services: ['Ceramic', 'Detailing']},
  {img: 'lux-genesis.jpg', area: '6th of October', title: 'Tint & styling', specialty: 'Window tint and interior protection', services: ['Tint', 'Wrap', 'Detailing']},
  {img: 'lux-bentley.jpg', area: 'Dokki · Giza', title: 'Luxury protection', specialty: 'Premium PPF for luxury cars', services: ['PPF', 'Ceramic']},
];
export const CARDS_CAIRO_PPF: Card[] = [
  {img: 'lux-dark-sports.jpg', area: 'New Cairo · Cairo', title: 'PPF & ceramic studio', specialty: 'Full-body paint protection film', services: ['PPF', 'Ceramic', 'Detailing']},
  {img: 'ppf-shop-porsche.jpg', area: 'Heliopolis · Cairo', title: 'Matte & gloss PPF', specialty: 'Self-healing film, gloss or matte', services: ['PPF', 'Wrap']},
  {img: 'lux-bentley.jpg', area: 'Zamalek · Cairo', title: 'Luxury protection', specialty: 'Premium PPF for luxury cars', services: ['PPF', 'Ceramic', 'Tint']},
  {img: 'det-hood.jpg', area: 'Maadi · Cairo', title: 'Precision installers', specialty: 'Edge-wrapped PPF and headlight film', services: ['PPF', 'Detailing']},
  {img: 'lux-headlights.jpg', area: 'Nasr City · Cairo', title: 'Performance protection', specialty: 'Track-ready front-end PPF', services: ['PPF', 'Ceramic']},
  {img: 'det-gloves-b.jpg', area: 'Sheraton · Cairo', title: 'PPF & detailing', specialty: 'Paint protection and deep detailing', services: ['PPF', 'Detailing', 'Tint']},
];

/* ------------------------------------------------------------------ */
/* Fixed layout (CSS px).                                                */
/* ------------------------------------------------------------------ */
export const L = {
  desktop: {
    w: 1440,
    vh: 900,
    pageH: 5300,
    studiosTop: 1180, // scroll position that frames title + filters
    filterY: 1553,
    citySel: {x: 676, w: 320},
    svcSel: {x: 1012, w: 328},
    selH: 54,
    gridY: 1640,
    cardW: 398,
    cardH: 600,
    cardGap: 23,
    gridX: 100,
    cols: 3,
    filmsY: 3560,
    howY: 4460,
    growthH: 4460,
  },
  mobile: {
    w: 390,
    vh: 844,
    pageH: 5600,
    studiosTop: 1880,
    filterY: 1920, // search row; city row +66, service row +132
    citySel: {x: 16, w: 358},
    svcSel: {x: 16, w: 358},
    selH: 54,
    gridY: 2130,
    cardW: 358,
    cardH: 560,
    cardGap: 16,
    gridX: 16,
    cols: 1,
    filmsY: 4220,
    howY: 4900,
    growthH: 4380,
  },
};
export type Mode = keyof typeof L;

export const citySelY = (m: Mode) => (m === 'desktop' ? L.desktop.filterY : L.mobile.filterY + 66);
export const svcSelY = (m: Mode) => (m === 'desktop' ? L.desktop.filterY : L.mobile.filterY + 132);
export const cardRect = (m: Mode, i: number) => {
  const l = L[m];
  const col = i % l.cols;
  const row = Math.floor(i / l.cols);
  return {x: l.gridX + col * (l.cardW + l.cardGap), y: l.gridY + row * (l.cardH + l.cardGap), w: l.cardW, h: l.cardH};
};

const img = (f: string) => staticFile(`img/${f}`);

/* ------------------------------------------------------------------ */
const Mark: React.FC<{size: number}> = ({size}) => (
  <div style={{width: size, height: size, border: `2px solid ${S.orange}`, transform: 'skew(-13deg)', display: 'grid', placeItems: 'center'}}>
    <span style={{transform: 'skew(13deg)', color: S.orange, fontFamily: OSW, fontSize: size * 0.42, fontWeight: 600}}>V</span>
  </div>
);

const Pill: React.FC<{items: string[]; active: number; dark?: boolean}> = ({items, active}) => (
  <div style={{display: 'flex', gap: 2, padding: 3, borderRadius: 99, border: `1px solid ${S.line}`, background: S.white}}>
    {items.map((t, i) => (
      <div key={t} style={{padding: '6px 11px', borderRadius: 99, fontFamily: INT, fontSize: 13, fontWeight: 600, background: i === active ? S.ink : 'transparent', color: i === active ? '#fff' : S.faint}}>
        {t}
      </div>
    ))}
  </div>
);

const Header: React.FC<{m: Mode; growth?: boolean}> = ({m, growth}) => {
  const mob = m === 'mobile';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: L[m].w, height: mob ? 72 : 76, padding: mob ? '0 16px' : '0 100px', display: 'flex', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', rowGap: 8}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
        <Mark size={mob ? 26 : 30} />
        <div style={{fontFamily: OSW, fontWeight: 500, fontSize: mob ? 16 : 18, letterSpacing: '0.13em', color: S.ink}}>VEYLON AUTO</div>
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
        {mob ? null : <Pill items={['EN', 'AR']} active={0} />}
        {mob ? null : <Pill items={['Light', 'Dark']} active={0} />}
        {mob ? null : (
          <div style={{background: growth ? S.ink : S.orange, color: growth ? '#fff' : '#140600', fontFamily: INT, fontWeight: 700, fontSize: 16, padding: '12px 20px', borderRadius: 99}}>
            {growth ? '← Back to marketplace' : 'For PPF businesses ↗'}
          </div>
        )}
      </div>
      {mob ? (
        <div style={{background: growth ? S.ink : S.orange, color: growth ? '#fff' : '#140600', fontFamily: INT, fontWeight: 700, fontSize: 13, padding: '9px 14px', borderRadius: 99}}>
          {growth ? '← Marketplace' : 'For businesses ↗'}
        </div>
      ) : null}
    </div>
  );
};

const Eyebrow: React.FC<{t: string; size?: number; color?: string}> = ({t, size = 13, color = S.orange}) => (
  <div style={{fontFamily: INT, fontWeight: 700, fontSize: size, letterSpacing: '0.16em', textTransform: 'uppercase', color}}>{t}</div>
);

const H: React.FC<{children: React.ReactNode; size: number; color?: string; style?: React.CSSProperties}> = ({children, size, color = S.ink, style}) => (
  <div style={{fontFamily: OSW, fontWeight: 600, fontSize: size, lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase', color, ...style}}>{children}</div>
);

const O: React.FC<{children: React.ReactNode}> = ({children}) => <span style={{color: S.orange}}>{children}</span>;

const Button: React.FC<{t: string; primary?: boolean; size?: number}> = ({t, primary, size = 16}) => (
  <div style={{padding: `${size * 0.8}px ${size * 1.3}px`, borderRadius: 99, fontFamily: INT, fontWeight: 700, fontSize: size, background: primary ? S.orange : S.white, color: primary ? '#140600' : S.ink, border: primary ? 'none' : `1px solid ${S.line}`}}>{t}</div>
);

/* ------------------------------------------------------------------ */
/* Marketplace page.                                                     */
/* ------------------------------------------------------------------ */
export type MarketState = {
  city: string;
  service: string;
  /** Open dropdown, and the option currently highlighted. */
  open?: 'city' | 'service' | null;
  hover?: string;
  cards: Card[];
  cardsIn?: number; // 0..1 swap animation
};

const Hero: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  return (
    <div style={{position: 'absolute', left: mob ? 16 : 100, top: mob ? 142 : 136, width: mob ? 358 : 1240, height: mob ? 1030 : 800}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: mob ? 358 : 640, display: 'flex', flexDirection: 'column', gap: mob ? 14 : 22}}>
        <Eyebrow t="The shortlist for serious car owners" size={mob ? 12 : 13} />
        <H size={mob ? 52 : 112}>
          Your car
          <br />
          deserves
          <br />
          better than
          <br />
          <O>
            the nearest
            <br />
            shop.
          </O>
        </H>
        <div style={{fontFamily: INT, fontSize: mob ? 16 : 19, lineHeight: 1.6, color: S.muted, marginTop: mob ? 4 : 8}}>
          PPF can protect your paint for years—or become an expensive mistake. Veylon puts Egypt&apos;s strongest protection studios side by side, so you can judge the work before you trust someone with the car.
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: mob ? 4 : 10}}>
          <Button t="Explore studios" primary size={mob ? 14 : 16} />
          <Button t="Watch the work" size={mob ? 14 : 16} />
        </div>
      </div>
      <div style={{position: 'absolute', left: mob ? 0 : 680, top: mob ? 560 : 0, width: mob ? 358 : 560, height: mob ? 460 : 700, borderRadius: mob ? 24 : 32, overflow: 'hidden', background: '#181818'}}>
        <Img src={img('lux-bentley.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '62% 50%', filter: 'saturate(.8) contrast(1.08)'}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.88)), linear-gradient(90deg, rgba(255,90,31,.16), transparent 45%)'}} />
        <div style={{position: 'absolute', right: 22, top: 22, width: mob ? 70 : 82, height: mob ? 70 : 82, borderRadius: 99, background: S.orange, display: 'grid', placeItems: 'center', textAlign: 'center', fontFamily: INT, fontWeight: 800, fontSize: mob ? 10 : 11.5, lineHeight: 1.15, color: '#140600'}}>
          VERIFIED
          <br />
          STUDIOS
        </div>
        <div style={{position: 'absolute', left: 20, right: 20, bottom: 20, background: 'rgba(10,10,10,.8)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 18, padding: mob ? 16 : 20}}>
          <div style={{fontFamily: INT, fontWeight: 600, fontSize: mob ? 13 : 15, color: '#fff'}}>PPF · Ceramic · Detailing</div>
          <div style={{fontFamily: INT, fontSize: mob ? 12 : 14, color: '#b9b9b4', marginTop: 4}}>Compare across Cairo, Alexandria and beyond</div>
          <div style={{display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap'}}>
            {['Free for car owners', 'Direct enquiries', 'Real work shown'].map((t) => (
              <div key={t} style={{fontFamily: INT, fontSize: mob ? 11 : 13, color: '#e8e8e3', border: '1px solid rgba(255,255,255,.25)', borderRadius: 99, padding: '6px 11px'}}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Proof: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  const items: [string, string][] = [
    ['3', 'ways to protect and restore your car'],
    ['0 EGP', 'charged to compare or enquire'],
    ['Cairo', 'Alexandria, Giza and beyond'],
    ['Direct', 'enquiries by call or WhatsApp'],
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: mob ? 16 : 100,
        top: mob ? 1190 : 1000,
        width: mob ? 358 : 1240,
        display: 'grid',
        gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: mob ? 12 : 20,
      }}
    >
      {items.map(([n, t]) => (
        <div key={t} style={{borderTop: `2px solid ${S.ink}`, paddingTop: 14}}>
          <div style={{fontFamily: OSW, fontWeight: 600, fontSize: mob ? 40 : 52, lineHeight: 1, color: S.ink}}>{n}</div>
          <div style={{fontFamily: INT, fontSize: mob ? 13 : 15, color: S.muted, marginTop: 6}}>{t}</div>
        </div>
      ))}
    </div>
  );
};

const Select: React.FC<{value: string; x: number; y: number; w: number; open: boolean; options: string[]; hover?: string}> = ({value, x, y, w, open, options, hover}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, zIndex: open ? 20 : 1}}>
    <div style={{height: 54, borderRadius: 14, border: `1px solid ${open ? S.orange : S.line}`, background: S.white, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', fontFamily: INT, fontSize: 16, color: S.text, boxShadow: open ? '0 0 0 4px rgba(255,90,31,.14)' : 'none'}}>
      <span>{value}</span>
      <svg width="14" height="9" viewBox="0 0 14 9">
        <path d="M1 1l6 6 6-6" stroke={S.text} strokeWidth="2" fill="none" />
      </svg>
    </div>
    {open ? (
      <div style={{marginTop: 6, background: S.white, borderRadius: 14, border: `1px solid ${S.line}`, boxShadow: '0 24px 60px rgba(0,0,0,.18)', padding: 6}}>
        {options.map((o) => (
          <div key={o} style={{height: 42, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 10, fontFamily: INT, fontSize: 15, fontWeight: o === hover ? 600 : 400, background: o === hover ? S.orange : 'transparent', color: o === hover ? '#140600' : S.text}}>
            {o}
          </div>
        ))}
      </div>
    ) : null}
  </div>
);

const ProviderCard: React.FC<{c: Card; m: Mode; highlight?: string; style?: React.CSSProperties}> = ({c, m, highlight, style}) => {
  const mob = m === 'mobile';
  return (
    <div style={{borderRadius: 22, overflow: 'hidden', background: S.white, border: `1px solid ${S.line}`, display: 'flex', flexDirection: 'column', ...style}}>
      <div style={{height: mob ? 250 : 270, position: 'relative', overflow: 'hidden'}}>
        <Img src={img(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.85) contrast(1.05)'}} />
        <div style={{position: 'absolute', right: 14, top: 14, background: S.orange, color: '#140600', fontFamily: INT, fontWeight: 700, fontSize: 12, padding: '6px 10px', borderRadius: 99}}>Verified</div>
      </div>
      <div style={{padding: mob ? 18 : 22, display: 'flex', flexDirection: 'column', gap: 12, flex: 1}}>
        <div style={{fontFamily: INT, fontWeight: 700, fontSize: 12, letterSpacing: '0.12em', color: S.faint, textTransform: 'uppercase'}}>{c.area}</div>
        <H size={mob ? 30 : 32} style={{letterSpacing: '-0.01em'}}>
          {c.title}
        </H>
        <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
          {c.services.map((s) => (
            <div key={s} style={{fontFamily: INT, fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 99, background: s === highlight ? S.orange : '#f1efe9', color: s === highlight ? '#140600' : S.muted}}>
              {s}
            </div>
          ))}
        </div>
        <div style={{borderTop: `1px solid ${S.line}`, paddingTop: 12, display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 8, fontFamily: INT, fontSize: 13}}>
          <span style={{color: S.faint}}>Specialty</span>
          <span style={{color: S.text}}>{c.specialty}</span>
          <span style={{color: S.faint}}>Area</span>
          <span style={{color: S.text}}>{c.area}</span>
          <span style={{color: S.faint}}>Enquiries</span>
          <span style={{color: S.text}}>Call or WhatsApp via Veylon</span>
        </div>
        <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontFamily: INT, fontWeight: 700, fontSize: 14, color: S.ink}}>
          <span>View full profile</span>
          <span style={{color: S.orange}}>↗</span>
        </div>
      </div>
    </div>
  );
};

const Studios: React.FC<{m: Mode; st: MarketState}> = ({m, st}) => {
  const mob = m === 'mobile';
  const l = L[m];
  const hl = st.service !== 'All services' ? st.service : undefined;
  const cardsIn = st.cardsIn ?? 1;
  return (
    <>
      <div style={{position: 'absolute', left: mob ? 16 : 100, top: mob ? 1480 : 1200, width: mob ? 358 : 1240, display: 'flex', flexDirection: mob ? 'column' : 'row', justifyContent: 'space-between', alignItems: mob ? 'flex-start' : 'flex-end', gap: mob ? 14 : 40}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: mob ? 12 : 16}}>
          <Eyebrow t="The Veylon shortlist" size={mob ? 12 : 13} />
          <H size={mob ? 40 : 76}>
            Verified studios.
            <br />
            Different standards.
            <br />
            <O>See the difference.</O>
          </H>
        </div>
        <div style={{fontFamily: INT, fontSize: mob ? 15 : 16, lineHeight: 1.6, color: S.muted, maxWidth: mob ? 358 : 360}}>
          Filter by city and treatment, then open any studio to see exactly what it does best. No endless tabs. No choosing blind.
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: mob ? 16 : 100,
          top: mob ? 1830 : 1478,
          width: mob ? 358 : 1240,
          borderRadius: 14,
          background: S.white,
          border: `1px solid ${S.line}`,
          padding: '12px 16px',
          fontFamily: INT,
          fontSize: mob ? 12 : 14,
          fontWeight: 600,
          color: S.text,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span style={{color: S.orange, fontWeight: 800}}>●</span>
        Every studio has a complete profile inside Veylon: photos, services, hours and contact details.
      </div>
      {/* filter bar */}
      <div style={{position: 'absolute', left: mob ? 16 : 100, top: l.filterY, width: mob ? 358 : 560, height: 54, borderRadius: 14, border: `1px solid ${S.line}`, background: S.white, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px', fontFamily: INT, fontSize: 16, color: S.faint}}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <circle cx="10" cy="10" r="7" stroke={S.faint} strokeWidth="2.4" fill="none" />
          <path d="M15.5 15.5 L22 22" stroke={S.faint} strokeWidth="2.4" strokeLinecap="round" />
        </svg>
        Search a studio or area
      </div>
      <div style={{position: 'absolute', left: 0, top: l.gridY, width: l.w, height: 3 * (l.cardH + l.cardGap)}}>
        {st.cards.slice(0, mob ? 3 : 6).map((c, i) => {
          const r = cardRect(m, i);
          const a = Math.max(0, Math.min(1, cardsIn * 1.6 - i * 0.12));
          return (
            <ProviderCard
              key={`${c.area}-${i}`}
              c={c}
              m={m}
              highlight={hl}
              style={{position: 'absolute', left: r.x, top: r.y - l.gridY, width: r.w, height: r.h, opacity: a, transform: `translateY(${(1 - a) * 24}px)`}}
            />
          );
        })}
      </div>
      {/* selects last so an open list overlays the grid */}
      <Select value={st.city} x={l.citySel.x} y={citySelY(m)} w={l.citySel.w} open={st.open === 'city'} options={CITIES} hover={st.hover} />
      <Select value={st.service} x={l.svcSel.x} y={svcSelY(m)} w={l.svcSel.w} open={st.open === 'service'} options={SERVICES} hover={st.hover} />
    </>
  );
};

const Films: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  const top = L[m].filmsY;
  const films: [string, string, string][] = [
    ['ppf-shop-porsche.jpg', 'Precision PPF installation', 'Film laid, edges wrapped, seams hidden'],
    ['det-polisher.jpg', 'Paint correction', 'Swirls removed before protection goes on'],
    ['det-gloves-c.jpg', 'Ceramic delivery', 'Hand-finished, inspected under light'],
  ];
  return (
    <div style={{position: 'absolute', left: mob ? 16 : 100, top, width: mob ? 358 : 1240}}>
      <div style={{display: 'flex', flexDirection: mob ? 'column' : 'row', justifyContent: 'space-between', alignItems: mob ? 'flex-start' : 'flex-end', gap: 14}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
          <Eyebrow t="Don't take their word for it" size={mob ? 12 : 13} />
          <H size={mob ? 44 : 84}>Judge the finish.</H>
        </div>
        <div style={{fontFamily: INT, fontSize: mob ? 15 : 16, lineHeight: 1.6, color: S.muted, maxWidth: 380}}>
          Good protection disappears into the car. Inspect the preparation, edge work and final finish before you make the call.
        </div>
      </div>
      <div style={{display: 'flex', flexDirection: mob ? 'column' : 'row', gap: 20, marginTop: 36, alignItems: 'flex-start'}}>
        {films.map(([f, t, s], i) => (
          <div key={t} style={{flex: 1, width: mob ? 358 : undefined, height: mob ? 200 : [520, 440, 460][i], marginTop: mob ? 0 : [0, 40, 80][i], borderRadius: 24, overflow: 'hidden', position: 'relative', background: '#111'}}>
            <Img src={img(f)} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.85)'}} />
            <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.85))'}} />
            <div style={{position: 'absolute', left: 22, bottom: 22, right: 22}}>
              <div style={{width: 40, height: 40, borderRadius: 99, background: S.orange, display: 'grid', placeItems: 'center', color: '#140600', fontFamily: INT, fontSize: 22, fontWeight: 700, marginBottom: 12}}>▶</div>
              <H size={mob ? 24 : 28} color="#fff">
                {t}
              </H>
              <div style={{fontFamily: INT, fontSize: 13, color: '#cfcfca', marginTop: 6}}>{s}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const How: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  const steps: [string, string][] = [
    ['Narrow it down', 'Select your city and treatment. We remove the irrelevant options immediately.'],
    ['Study the work', 'Compare specialties, services and real finishes—not whichever studio bought the loudest ad.'],
    ['Speak directly', 'Contact the studio, explain the car and get the details you need before committing.'],
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: L[m].howY, width: L[m].w, height: mob ? 700 : 840, background: S.dark, padding: mob ? '48px 16px' : '80px 100px'}}>
      <Eyebrow t="Choose on evidence" size={mob ? 12 : 13} />
      <H size={mob ? 40 : 76} color="#fff" style={{marginTop: 14}}>
        One careless installer
        <br />
        can ruin <O>expensive paint.</O>
      </H>
      <div style={{display: 'grid', gridTemplateColumns: mob ? '1fr' : 'repeat(3, 1fr)', gap: mob ? 18 : 30, marginTop: mob ? 30 : 56}}>
        {steps.map(([t, d], i) => (
          <div key={t} style={{borderTop: '1px solid #2a2a2a', paddingTop: 18}}>
            <div style={{fontFamily: OSW, color: S.orange, fontSize: 16}}>0{i + 1}</div>
            <H size={mob ? 26 : 32} color="#fff" style={{marginTop: 8}}>
              {t}
            </H>
            <div style={{fontFamily: INT, fontSize: 14, lineHeight: 1.6, color: '#a9a9a5', marginTop: 8}}>{d}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MarketPage: React.FC<{m: Mode; st: MarketState}> = ({m, st}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: L[m].w, height: L[m].pageH, background: S.paper, overflow: 'hidden'}}>
    <Header m={m} />
    <Hero m={m} />
    <Proof m={m} />
    <Studios m={m} st={st} />
    <Films m={m} />
    <How m={m} />
  </div>
);

/* ------------------------------------------------------------------ */
/* Studio profile modal (viewport-positioned).                          */
/* ------------------------------------------------------------------ */
export const PROFILE_CARD = CARDS_CAIRO_PPF[0];

export const profileRect = (m: Mode) => (m === 'desktop' ? {x: 200, y: 40, w: 1040, h: 820} : {x: 10, y: 30, w: 370, h: 790});

export const ProfileModal: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  const r = profileRect(m);
  const c = PROFILE_CARD;
  const detail: [string, string][] = [
    ['Specialty', c.specialty],
    ['Services', 'PPF · Ceramic · Detailing'],
    ['Area', c.area],
    ['Pricing', 'Tailored quote after inspection'],
  ];
  return (
    <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: mob ? 26 : 30, overflow: 'hidden', background: S.white, boxShadow: '0 40px 120px rgba(0,0,0,.45)'}}>
      <div style={{height: mob ? 280 : 360, position: 'relative'}}>
        <Img src={img(c.img)} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 60%'}} />
        <div style={{position: 'absolute', right: 18, top: 18, width: 38, height: 38, borderRadius: 99, background: '#fff', display: 'grid', placeItems: 'center', fontFamily: INT, fontSize: 20}}>×</div>
      </div>
      <div style={{padding: mob ? 22 : 34, display: 'flex', flexDirection: 'column', gap: mob ? 12 : 16}}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
            <Eyebrow t={`${c.area} · Egypt`} size={12} />
            <H size={mob ? 34 : 46}>{c.title}</H>
            <div style={{fontFamily: INT, fontSize: mob ? 14 : 15, lineHeight: 1.55, color: S.muted, maxWidth: 560}}>
              Paint protection film, ceramic coating and detailing, with the preparation and edge work shown before you book.
            </div>
          </div>
          {mob ? null : (
            <div style={{border: `1px solid ${S.line}`, borderRadius: 18, padding: '18px 26px', textAlign: 'center', minWidth: 190}}>
              <div style={{fontFamily: INT, fontSize: 13, color: S.faint}}>Veylon status</div>
              <div style={{fontFamily: OSW, fontSize: 38, fontWeight: 600, color: S.orange, marginTop: 4}}>VERIFIED</div>
              <div style={{fontFamily: INT, fontSize: 12, color: S.faint, marginTop: 2}}>Real work shown</div>
            </div>
          )}
        </div>
        <div style={{display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 10}}>
          {detail.map(([k, v]) => (
            <div key={k} style={{border: `1px solid ${S.line}`, borderRadius: 14, padding: '12px 14px'}}>
              <div style={{fontFamily: INT, fontSize: 12, color: S.faint}}>{k}</div>
              <div style={{fontFamily: INT, fontSize: 13.5, fontWeight: 600, color: S.text, marginTop: 4, lineHeight: 1.35}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display: 'flex', gap: 12, marginTop: 4}}>
          <Button t="Call business" size={mob ? 14 : 16} />
          <Button t="Request through Veylon" primary size={mob ? 14 : 16} />
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Growth ("For PPF businesses") page.                                  */
/* ------------------------------------------------------------------ */
export const GROWTH_STOPS: Record<Mode, number[]> = {
  desktop: [300, 1040, 1950, 2900, 3560],
  mobile: [560, 1100, 2230, 3010, 3536],
};

export const GrowthPage: React.FC<{m: Mode}> = ({m}) => {
  const mob = m === 'mobile';
  const X = mob ? 16 : 100;
  const W = mob ? 358 : 1240;
  const pillars: [string, string][] = [
    ['Look as premium as the work', 'We replace the generic detail-shop website with a sales experience that makes the quality visible and earns the enquiry.'],
    ['Reach owners ready to buy', 'Creative and paid campaigns built around expensive paint, real risk and clear outcomes—not boosted posts.'],
    ['Own high-intent search', 'When someone searches for PPF in Cairo or Alexandria, your studio should be one of the first credible options.'],
    ['Stop losing hot leads', 'Fast routing, cleaner qualification and follow-up, so serious buyers never die inside an unread WhatsApp thread.'],
  ];
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: L[m].w, height: L[m].growthH, background: S.paper, overflow: 'hidden'}}>
      <Header m={m} growth />
      {/* hero */}
      <div style={{position: 'absolute', left: X, top: mob ? 130 : 140, width: W}}>
        <Eyebrow t="The growth system behind the studios" size={mob ? 12 : 13} />
        {mob ? (
          <H size={56} style={{marginTop: 18}}>
            Great work
            <br />
            should make
            <br />
            you <O>the</O>
            <br />
            <O>obvious</O>
            <br />
            <O>choice.</O>
          </H>
        ) : (
          <H size={120} style={{marginTop: 18}}>
            Great work should
            <br />
            make you <O>the obvious</O>
            <br />
            <O>choice.</O>
          </H>
        )}
      </div>
      <div style={{position: 'absolute', left: X, top: mob ? 470 : 560, width: mob ? 358 : 520, fontFamily: INT, fontSize: mob ? 15 : 17, lineHeight: 1.6, color: S.muted}}>
        Most PPF businesses do premium work and market it like a commodity. Veylon fixes the gap: we rebuild how your studio is seen, put it in front of ready-to-buy car owners and install the path that turns attention into booked cars.
      </div>
      <div style={{position: 'absolute', left: mob ? 16 : 860, top: mob ? 660 : 500, width: mob ? 358 : 480, borderRadius: 24, background: S.white, border: `1px solid ${S.line}`, padding: 28}}>
        <Eyebrow t="Results across four partner businesses" size={12} />
        <div style={{fontFamily: OSW, fontWeight: 600, fontSize: mob ? 72 : 88, color: S.orange, lineHeight: 1, marginTop: 10}}>€102K</div>
        <div style={{fontFamily: INT, fontSize: 14, lineHeight: 1.55, color: S.muted, marginTop: 8}}>
          in monthly client revenue. The studio with the best acquisition system wins more often than the studio with the best camera.
        </div>
        <div style={{display: 'flex', gap: 10, alignItems: 'flex-end', height: 90, marginTop: 18}}>
          {[52, 80, 44, 70].map((h, i) => (
            <div key={i} style={{flex: 1, height: `${h}%`, borderRadius: 6, background: `linear-gradient(180deg, ${S.orange}, #b8360b)`}} />
          ))}
        </div>
      </div>
      {/* pillars */}
      <div style={{position: 'absolute', left: X, top: mob ? 1120 : 1080, width: W}}>
        <Eyebrow t="Not an agency retainer. A revenue system." size={mob ? 12 : 13} />
        <H size={mob ? 40 : 76} style={{marginTop: 14}}>
          We fix every place a customer
          {mob ? ' ' : <br />}
          can choose you—<O>or lose you.</O>
        </H>
        <div style={{display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: mob ? 12 : 22, marginTop: mob ? 24 : 40}}>
          {pillars.map(([t, d], i) => (
            <div key={t} style={{background: S.white, border: `1px solid ${S.line}`, borderRadius: 22, padding: mob ? 20 : 28, minHeight: mob ? 0 : 220, position: 'relative'}}>
              <div style={{position: 'absolute', right: 24, top: 18, fontFamily: OSW, fontSize: mob ? 30 : 40, color: S.ink}}>0{i + 1}</div>
              <H size={mob ? 26 : 34} style={{maxWidth: mob ? 250 : 420, marginTop: mob ? 20 : 40}}>
                {t}
              </H>
              <div style={{fontFamily: INT, fontSize: 14, lineHeight: 1.55, color: S.muted, marginTop: 10, maxWidth: 480}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      {/* showroom */}
      <div style={{position: 'absolute', left: X, top: mob ? 2260 : 1990, width: W}}>
        <Eyebrow t="Your digital showroom" size={mob ? 12 : 13} />
        <H size={mob ? 38 : 72} style={{marginTop: 14, maxWidth: 900}}>
          If the work looks premium but the website does not, <O>customers assume the work is not.</O>
        </H>
        <div style={{display: 'flex', flexDirection: mob ? 'column' : 'row', gap: 18, marginTop: mob ? 22 : 36}}>
          <div style={{flex: 1, height: mob ? 220 : 380, borderRadius: 18, background: '#e9e7e2', border: `1px solid ${S.line}`, padding: 26, fontFamily: 'Arial, sans-serif'}}>
            <div style={{fontSize: 12, fontWeight: 700, color: S.faint, letterSpacing: '0.1em'}}>BEFORE</div>
            <div style={{fontSize: mob ? 22 : 28, fontWeight: 700, color: '#24517c', marginTop: 14}}>AUTO DETAILING CENTER</div>
            <div style={{fontSize: 15, color: '#444', marginTop: 12}}>We offer detailing, washing, PPF and ceramic coating. Call us for pricing.</div>
            <div style={{height: mob ? 60 : 150, background: '#cfcdc8', marginTop: 18}} />
          </div>
          <div style={{flex: 1, height: mob ? 220 : 380, borderRadius: 18, overflow: 'hidden', position: 'relative', background: '#111'}}>
            <Img src={img('lux-dark-sports.jpg')} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.6)'}} />
            <div style={{position: 'absolute', left: 26, top: 22, right: 26}}>
              <div style={{fontFamily: INT, fontSize: 12, fontWeight: 700, color: S.orange, letterSpacing: '0.1em'}}>AFTER · VEYLON CONCEPT</div>
              <H size={mob ? 32 : 48} color="#fff" style={{marginTop: 12}}>
                Protection without compromise.
              </H>
              <div style={{marginTop: 16, display: 'inline-block', background: S.orange, color: '#140600', fontFamily: INT, fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 99}}>Book a consultation</div>
            </div>
          </div>
        </div>
      </div>
      {/* seo */}
      <div style={{position: 'absolute', left: X, top: mob ? 3040 : 2960, width: W, display: 'flex', flexDirection: mob ? 'column' : 'row', gap: mob ? 22 : 60}}>
        <div style={{flex: 1}}>
          <Eyebrow t="SEO + Google" size={mob ? 12 : 13} />
          <H size={mob ? 38 : 70} style={{marginTop: 14}}>
            Your competitor should not own the search <O>that could have booked you.</O>
          </H>
        </div>
        <div style={{flex: 1, background: '#ebe8e1', borderRadius: 24, padding: mob ? 16 : 30}}>
          <div style={{background: S.white, borderRadius: 18, padding: mob ? 16 : 24, boxShadow: '0 12px 40px rgba(0,0,0,.08)'}}>
            <div style={{border: `1px solid ${S.line}`, borderRadius: 99, padding: '12px 18px', fontFamily: INT, fontSize: 15, color: S.text}}>best PPF installer in Cairo</div>
            <div style={{marginTop: 18, fontFamily: INT}}>
              <div style={{fontSize: 12, color: S.faint}}>Your studio › ppf</div>
              <div style={{fontSize: mob ? 16 : 19, fontWeight: 600, color: '#1f4aa8', marginTop: 4}}>Premium PPF installation · Request a consultation</div>
              <div style={{fontSize: 13, color: S.muted, marginTop: 4}}>Certified protection, documented workmanship and a clear path to pricing.</div>
            </div>
            <div style={{marginTop: 18, paddingTop: 16, borderTop: `1px solid ${S.line}`, fontFamily: INT, opacity: 0.6}}>
              <div style={{fontSize: 12, color: S.faint}}>directory › local</div>
              <div style={{fontSize: mob ? 15 : 17, fontWeight: 600, color: '#1f4aa8', marginTop: 4}}>Automotive protection services</div>
              <div style={{fontSize: 13, color: S.muted, marginTop: 4}}>General listings and nearby options.</div>
            </div>
          </div>
        </div>
      </div>
      {/* egypt */}
      <div style={{position: 'absolute', left: X, top: mob ? 3700 : 3640, width: W, height: mob ? 600 : 720, borderRadius: 30, overflow: 'hidden', background: S.dark}}>
        <Img src={img('cairo-sunset-bridge.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55}} />
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(13,13,13,.95), rgba(13,13,13,.35))'}} />
        <div style={{position: 'absolute', left: mob ? 22 : 56, top: mob ? 40 : 64, right: mob ? 22 : 480}}>
          <Eyebrow t="Now in Egypt" size={mob ? 12 : 13} />
          <H size={mob ? 40 : 76} color="#fff" style={{marginTop: 16}}>
            Become the name car owners hear <O>before they start comparing.</O>
          </H>
          <div style={{fontFamily: INT, fontSize: mob ? 14 : 16, lineHeight: 1.6, color: '#c9c9c4', marginTop: 18, maxWidth: 560}}>
            For a small number of ambitious PPF, ceramic and detailing businesses in Cairo, Alexandria and beyond.
          </div>
          <div style={{display: 'flex', gap: 12, marginTop: 24, alignItems: 'center', flexWrap: 'wrap'}}>
            <div style={{background: S.orange, color: '#140600', fontFamily: INT, fontWeight: 700, fontSize: mob ? 14 : 16, padding: '13px 22px', borderRadius: 99}}>Call +20 104 375 4416</div>
            <div style={{border: '1px solid rgba(255,255,255,.3)', color: '#fff', fontFamily: INT, fontWeight: 700, fontSize: mob ? 14 : 16, padding: '13px 22px', borderRadius: 99}}>WhatsApp ↗</div>
          </div>
        </div>
      </div>
    </div>
  );
};
