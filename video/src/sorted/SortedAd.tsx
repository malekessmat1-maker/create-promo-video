import React from 'react';
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { z } from 'zod';
import { zColor } from '@remotion/zod-types';
import '../fonts';

/* 15 s at 30 fps. Beats line up with scripts/sorted_soundtrack.py (120 BPM, 15 frames per beat). */
export const S = { drain: 60, meet: 120, f1: 200, f2: 245, f3: 290, f4: 335, cta: 380, end: 450 };

export const sortedSchema = z.object({
  hook: z.string(), drain: z.string(), meet: z.string(),
  features: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  product: z.string(), price: z.string(), priceNote: z.string(), platforms: z.string(), button: z.string(),
  green: zColor(), amber: zColor(), coral: zColor(),
});
export type SortedProps = z.infer<typeof sortedSchema>;
export const sortedDefaults: SortedProps = {
  hook: 'Payday.', drain: 'Where did it all go?', meet: 'Meet Sorted.',
  features: ['Log a payment in 10 seconds.', 'See every category, live.', 'Know your debt-free date.', 'Watch your savings grow.'],
  product: '2027 Budget Planner', price: '$17', priceNote: 'once · no subscription', platforms: 'Excel · Google Sheets · Numbers', button: 'Get it today',
  green: '#2e7d5b', amber: '#e0a33f', coral: '#e0603f',
};

const INK = '#17221d', MUTED = '#5d6f67', PAPER = '#f5f9f6', LINE = '#d9e4de', MINT = '#e3f1e9', YELLOW = '#fff6d6';
const DISPLAY = 'Bricolage, "Avenir Next", sans-serif', BODY = 'Figtree, Helvetica, sans-serif', MONO = 'JetBrains, ui-monospace, monospace';
const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const useU = () => { const { width, height } = useVideoConfig(); return { u: Math.min(width, height) / 1080, portrait: height > width }; };

const Pop: React.FC<{ text: string; at: number; style?: React.CSSProperties; stagger?: number }> = ({ text, at, style, stagger = 3 }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  return (
    <span style={{ display: 'inline-block', ...style }}>
      {text.split(' ').map((w, i, arr) => {
        const s = spring({ frame: frame - at - i * stagger, fps, config: { damping: 14, stiffness: 160, mass: 0.6 } });
        return <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 70}%) scale(${0.85 + 0.15 * s})` }}>{w}{i < arr.length - 1 ? ' ' : ''}</span>;
      })}
    </span>
  );
};

/* Moving spreadsheet grid behind everything */
const Backdrop: React.FC<{ dark: number }> = ({ dark }) => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.6) % 60;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`, backgroundSize: '160px 60px', backgroundPosition: `${-shift * 2.6}px ${-shift}px`, opacity: 0.55 }} />
      <AbsoluteFill style={{ background: 'radial-gradient(60% 50% at 70% 40%, rgba(46,125,91,.16), transparent 70%), radial-gradient(40% 40% at 15% 85%, rgba(224,163,63,.16), transparent 70%)' }} />
      <AbsoluteFill style={{ background: '#17221d', opacity: dark }} />
    </AbsoluteFill>
  );
};

/* 0–4 s: payday, then the balance drains to almost nothing */
const Hook: React.FC<SortedProps> = (p) => {
  const frame = useCurrentFrame(); const { u, portrait } = useU();
  const drainT = interpolate(frame, [S.drain, S.drain + 40], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const bal = 4600 - (4600 - 12.4) * drainT;
  const shake = frame > S.drain && frame < S.drain + 40 ? Math.sin(frame * 2.3) * 6 * u * drainT : 0;
  const red = interpolate(drainT, [0.3, 1], [0, 1], clamp);
  const out = interpolate(frame, [S.meet - 8, S.meet], [1, 0], clamp);
  const bills = ['Rent', 'Groceries', 'Takeaway', 'Subscriptions', 'Shopping', 'Fuel', 'Coffee', 'Gym'];
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: out, textAlign: 'center' }}>
      {bills.map((b, i) => {
        const st = S.drain + i * 4; const k = interpolate(frame, [st, st + 26], [0, 1], clamp);
        const ang = (i / bills.length) * Math.PI * 2 + 0.4;
        const r = (portrait ? 160 + 380 * k : 200 + 620 * k) * u;
        return <div key={b} style={{ position: 'absolute', left: '50%', top: '58%', transform: `translate(-50%,-50%) translate(${Math.cos(ang) * r}px, ${Math.sin(ang) * r * (portrait ? 1.3 : 0.55) + 120 * u * k}px) scale(${0.7 + k * 0.4})`, opacity: k > 0 ? Math.min(1, k * 6) * (1 - k) * 0.9 : 0, fontFamily: MONO, fontSize: 34 * u, color: p.coral, background: '#fff', padding: `${8 * u}px ${18 * u}px`, borderRadius: 999, boxShadow: '0 10px 30px -10px rgba(0,0,0,.25)' }}>−{b}</div>;
      })}
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, color: INK, fontSize: 150 * u, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {frame < S.drain + 6 ? <Pop text={p.hook} at={4} /> : <Pop text={p.drain} at={S.drain + 8} stagger={4} style={{ fontSize: portrait ? '0.62em' : '0.7em' }} />}
      </div>
      <div style={{ marginTop: 30 * u, transform: `translateX(${shake}px)`, fontFamily: MONO, fontWeight: 600, fontSize: 120 * u, color: `rgb(${23 + (224 - 23) * red},${34 + (96 - 34) * red},${29 + (63 - 29) * red})`, opacity: interpolate(frame, [10, 20], [0, 1], clamp) }}>
        {bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 600, color: MUTED, fontSize: 30 * u, opacity: interpolate(frame, [14, 24], [0, 1], clamp) }}>{frame < S.drain + 20 ? 'Account balance · day 1' : 'Account balance · day 23'}</div>
    </AbsoluteFill>
  );
};

/* The product: a spreadsheet card in 3D whose content changes per beat */
const CATS: [string, string, number, number][] = [['Rent / mortgage', 'Needs', 1350, 1350], ['Groceries', 'Needs', 450, 427], ['Utilities', 'Needs', 180, 179], ['Eating out', 'Wants', 200, 80], ['Shopping', 'Wants', 150, 176], ['Emergency fund', 'Savings', 500, 500], ['Credit card', 'Debt', 250, 250]];
const TX: [string, string, string, string][] = [['Jan 01', 'Monthly salary', 'Salary', '4,200.00'], ['Jan 01', 'Rent', 'Rent / mortgage', '1,350.00'], ['Jan 04', 'Weekly shop', 'Groceries', '112.40'], ['Jan 08', 'Dinner with friends', 'Eating out', '52.10'], ['Jan 15', 'Credit card payment', 'Credit card', '250.00']];

const Sheet: React.FC<SortedProps> = (p) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const { u, portrait } = useU();
  const local = frame - S.meet;
  const enter = spring({ frame: local - 10, fps, config: { damping: 16, stiffness: 70 } });
  const leave = interpolate(frame, [S.cta - 10, S.cta + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const ry = -14 + (1 - enter) * 70 + Math.sin(frame / 40) * 3 - leave * 40;
  const rx = 8 + (1 - enter) * 20 + Math.cos(frame / 50) * 2;
  const pane = frame < S.f1 ? 'month' : frame < S.f2 ? 'tx' : frame < S.f3 ? 'month' : frame < S.f4 ? 'debt' : 'goals';
  const tabName = { tx: 'Transactions', month: 'This Month', debt: 'Debt Payoff', goals: 'Savings Goals' }[pane];
  const paneStart = { tx: S.f1, month: frame < S.f2 ? S.meet : S.f2, debt: S.f3, goals: S.f4 }[pane];
  const pf = frame - paneStart;
  const W = (portrait ? 900 : 1000) * u;
  const fs = 26 * u;
  const cell: React.CSSProperties = { padding: `${10 * u}px ${8 * u}px`, borderBottom: `1px solid #edf2ef`, fontSize: fs, whiteSpace: 'nowrap', overflow: 'hidden' };
  const headRow: React.CSSProperties = { background: p.green, color: '#fff', fontWeight: 600, borderRadius: 8 * u, fontSize: fs * 0.9 };
  let body: React.ReactNode = null;
  if (pane === 'month') {
    body = (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 * u, marginBottom: 16 * u }}>
          {[['Income', 4550, INK], ['Spent', 2761, INK], ['Left over', 444, p.green]].map(([l, v, c], i) => (
            <div key={i} style={{ background: PAPER, borderRadius: 12 * u, padding: `${12 * u}px ${16 * u}px` }}>
              <div style={{ fontSize: 18 * u, color: MUTED, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l as string}</div>
              <div style={{ fontFamily: MONO, fontSize: 36 * u, color: c as string }}>{fmt((v as number) * interpolate(pf, [0, 30], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }))}</div>
            </div>))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr 1.2fr .7fr', ...headRow }}><span style={cell}>Category</span><span style={cell}>Group</span><span style={cell}>Used</span><span style={{ ...cell, textAlign: 'right' }}>Left</span></div>
        {CATS.map(([n, g, b, a], i) => {
          const k = interpolate(pf, [8 + i * 3, 38 + i * 3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          const used = a / b; const over = used > 1;
          return (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '1.5fr .8fr 1.2fr .7fr', alignItems: 'center' }}>
              <span style={cell}>{n}</span><span style={{ ...cell, color: MUTED, fontSize: fs * 0.8 }}>{g}</span>
              <span style={{ ...cell }}><div style={{ height: 12 * u, background: '#edf2ef', borderRadius: 8 * u, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(used, 1) * 100 * k}%`, background: over && k > 0.9 ? p.coral : '#8ccba9', borderRadius: 8 * u }} /></div></span>
              <span style={{ ...cell, textAlign: 'right', fontFamily: MONO, color: over && k > 0.9 ? p.coral : INK }}>{over ? '−' : ''}{fmt(Math.abs(b - a) * k)}</span>
            </div>);
        })}
      </>);
  } else if (pane === 'tx') {
    const typed = 'Weekly shop';
    const chars = Math.floor(interpolate(pf, [10, 26], [0, typed.length], clamp));
    const amt = '86.30'.slice(0, Math.floor(interpolate(pf, [28, 36], [0, 5], clamp)));
    const catOn = pf > 26;
    body = (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '.8fr 1.5fr 1.2fr .8fr', ...headRow }}><span style={cell}>Date</span><span style={cell}>Description</span><span style={cell}>Category ▾</span><span style={{ ...cell, textAlign: 'right' }}>Amount</span></div>
        {TX.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '.8fr 1.5fr 1.2fr .8fr' }}>{t.map((c, j) => <span key={j} style={{ ...cell, textAlign: j === 3 ? 'right' : 'left', fontFamily: j === 3 ? MONO : BODY }}>{c}</span>)}</div>))}
        <div style={{ display: 'grid', gridTemplateColumns: '.8fr 1.5fr 1.2fr .8fr', background: YELLOW, borderRadius: 8 * u, outline: `${3 * u}px solid ${p.green}` }}>
          <span style={cell}>Jan 18</span>
          <span style={cell}>{typed.slice(0, chars)}<span style={{ opacity: pf % 16 < 8 && chars < typed.length ? 1 : 0 }}>|</span></span>
          <span style={{ ...cell, color: catOn ? INK : MUTED }}>{catOn ? 'Groceries ✓' : 'Pick…'}</span>
          <span style={{ ...cell, textAlign: 'right', fontFamily: MONO }}>{amt}</span>
        </div>
        <div style={{ marginTop: 14 * u, fontSize: 22 * u, color: p.green, fontWeight: 600, opacity: interpolate(pf, [36, 42], [0, 1], clamp) }}>✓ Groceries: 339.70 of 450 used</div>
      </>);
  } else if (pane === 'debt') {
    const months = Math.round(interpolate(pf, [4, 34], [0, 45], { ...clamp, easing: Easing.out(Easing.cubic) }));
    const d = new Date(2027, months, 1);
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    body = (
      <>
        <div style={{ textAlign: 'center', padding: `${20 * u}px 0` }}>
          <div style={{ fontSize: 22 * u, color: MUTED, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Debt-free by</div>
          <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 130 * u, color: p.green, lineHeight: 1.05, letterSpacing: '-0.03em' }}>{label}</div>
          <div style={{ fontFamily: MONO, fontSize: 26 * u, color: MUTED }}>{months + 1} months · 26,100 cleared</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 * u, height: 160 * u }}>
          {Array.from({ length: 30 }, (_, i) => {
            const h = Math.max(0, 100 - i * 3.4) * interpolate(pf, [i * 0.8, i * 0.8 + 10], [0, 1], clamp);
            return <div key={i} style={{ flex: 1, height: `${h}%`, background: i < 9 ? p.coral : i < 19 ? p.amber : p.green, borderRadius: `${4 * u}px ${4 * u}px 0 0`, opacity: 0.9 }} />;
          })}
        </div>
      </>);
  } else {
    const goals: [string, number, number][] = [['Emergency fund', 9000, 0.78], ['Summer holiday', 2500, 0.92], ['New laptop', 1400, 0.64], ['House deposit', 30000, 0.31]];
    body = (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 * u, padding: `${10 * u}px 0` }}>
        {goals.map(([n, target, pct], i) => {
          const k = interpolate(pf, [4 + i * 4, 34 + i * 4], [0, pct], { ...clamp, easing: Easing.out(Easing.cubic) });
          const C = 2 * Math.PI * 70;
          return (
            <div key={n} style={{ background: PAPER, borderRadius: 18 * u, padding: 20 * u, display: 'flex', alignItems: 'center', gap: 18 * u }}>
              <svg width={150 * u} height={150 * u} viewBox="0 0 170 170"><circle cx="85" cy="85" r="70" stroke={MINT} strokeWidth="18" fill="none" /><circle cx="85" cy="85" r="70" stroke={p.green} strokeWidth="18" fill="none" strokeLinecap="round" strokeDasharray={`${C * k} ${C}`} transform="rotate(-90 85 85)" /><text x="85" y="96" textAnchor="middle" fontFamily={MONO} fontSize="34" fill={INK}>{Math.round(k * 100)}%</text></svg>
              <div><div style={{ fontWeight: 600, fontSize: 26 * u }}>{n}</div><div style={{ fontFamily: MONO, color: MUTED, fontSize: 22 * u }}>{fmt(target * k)} / {fmt(target)}</div></div>
            </div>);
        })}
      </div>);
  }
  const tabs = ['Setup', 'Transactions', 'This Month', 'Year Dashboard', 'Debt Payoff', 'Savings Goals'];
  return (
    <AbsoluteFill style={{ perspective: 2200 * u, alignItems: portrait ? 'center' : 'flex-end', justifyContent: portrait ? 'flex-end' : 'center', padding: portrait ? `0 0 ${170 * u}px` : `0 ${110 * u}px 0 0` }}>
      <div style={{ width: W, background: '#fff', borderRadius: 24 * u, overflow: 'hidden', border: `1px solid ${LINE}`, boxShadow: `0 ${4 * u}px ${8 * u}px rgba(23,34,29,.06), ${60 * u}px ${80 * u}px ${120 * u}px -${40 * u}px rgba(23,34,29,.4)`, transform: `translateY(${(1 - enter) * 300 * u + leave * -200 * u}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${0.9 + 0.1 * enter - leave * 0.2})`, opacity: Math.min(enter * 1.5, 1) * (1 - leave), fontFamily: BODY, color: INK }}>
        <div style={{ display: 'flex', gap: 10 * u, alignItems: 'center', padding: `${14 * u}px ${20 * u}px`, background: '#eef3f0', borderBottom: `1px solid ${LINE}` }}>
          {[0, 1, 2].map((i) => <i key={i} style={{ width: 14 * u, height: 14 * u, borderRadius: '50%', background: '#d3ddd8', display: 'block' }} />)}
          <span style={{ marginLeft: 10 * u, fontSize: 20 * u, color: MUTED, fontWeight: 600 }}>Sorted-Budget-Planner.xlsx</span>
        </div>
        <div style={{ padding: `${22 * u}px ${26 * u}px ${14 * u}px`, minHeight: 600 * u }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 * u }}>
            <b style={{ fontFamily: DISPLAY, color: p.green, fontSize: 44 * u }}>{tabName}</b>
            <span style={{ fontSize: 20 * u, background: YELLOW, padding: `${4 * u}px ${12 * u}px`, borderRadius: 8 * u, fontWeight: 600 }}>{pane === 'debt' ? 'Extra 150 / month' : pane === 'goals' ? '4 goals' : 'January ▾'}</span>
          </div>
          {body}
        </div>
        <div style={{ display: 'flex', gap: 2, padding: `0 ${12 * u}px`, background: '#eef3f0', borderTop: `1px solid ${LINE}` }}>
          {tabs.map((t) => <span key={t} style={{ fontSize: 18 * u, padding: `${10 * u}px ${12 * u}px`, whiteSpace: 'nowrap', color: t === tabName ? p.green : MUTED, fontWeight: t === tabName ? 700 : 400, background: t === tabName ? '#fff' : 'transparent', borderTop: t === tabName ? `${3 * u}px solid ${p.green}` : '0' }}>{t}</span>)}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* Captions beside (landscape) or above (portrait) the sheet */
const Captions: React.FC<SortedProps> = (p) => {
  const frame = useCurrentFrame() + S.meet; // this scene's Sequence starts at S.meet
  const { fps } = useVideoConfig(); const { u, portrait } = useU();
  const logo = spring({ frame: frame - S.meet, fps, config: { damping: 12, stiffness: 150 } });
  const beats = [S.f1, S.f2, S.f3, S.f4];
  const idx = beats.findIndex((b, i) => frame >= b && frame < (beats[i + 1] ?? S.cta));
  const out = interpolate(frame, [S.cta - 8, S.cta], [1, 0], clamp);
  return (
    <AbsoluteFill style={{ opacity: out, justifyContent: portrait ? 'flex-start' : 'center', alignItems: portrait ? 'center' : 'flex-start', padding: portrait ? `${200 * u}px ${70 * u}px 0` : `0 0 0 ${110 * u}px`, textAlign: portrait ? 'center' : 'left' }}>
      <div style={{ maxWidth: portrait ? 940 * u : 640 * u }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: (portrait ? 92 : 104) * u, letterSpacing: '-0.035em', color: INK, transform: `scale(${logo})`, transformOrigin: portrait ? 'center' : 'left center', lineHeight: 1 }}>
          {p.meet.replace('.', '')}<span style={{ color: p.green }}>.</span>
        </div>
        <div style={{ height: 30 * u }} />
        <div style={{ minHeight: (portrait ? 160 : 260) * u }}>
          {idx >= 0 && (
            <div key={idx} style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: (portrait ? 62 : 70) * u, letterSpacing: '-0.02em', color: INK, lineHeight: 1.05 }}>
              <div style={{ fontFamily: MONO, fontSize: 24 * u, color: p.green, letterSpacing: '0.12em', marginBottom: 12 * u, opacity: interpolate(frame - beats[idx], [0, 6], [0, 1], clamp) }}>0{idx + 1} / 04</div>
              <Pop text={p.features[idx]} at={beats[idx] + 1 - S.meet} stagger={2} />
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<SortedProps> = (p) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const { u, portrait } = useU();
  const f = frame;
  const a = spring({ frame: f, fps, config: { damping: 12, stiffness: 140 } });
  const price = spring({ frame: f - 14, fps, config: { damping: 10, stiffness: 160 } });
  const btn = spring({ frame: f - 26, fps, config: { damping: 12, stiffness: 140 } });
  const pulse = (f % 30) / 30;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: BODY }}>
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: (portrait ? 190 : 170) * u, letterSpacing: '-0.04em', color: INK, transform: `scale(${a})`, lineHeight: 0.95 }}>Sorted<span style={{ color: p.green }}>.</span></div>
      <div style={{ fontFamily: MONO, fontSize: 30 * u, color: p.green, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 16 * u, opacity: interpolate(f, [6, 16], [0, 1], clamp) }}>{p.product}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 * u, marginTop: 40 * u, transform: `scale(${price})`, flexDirection: portrait ? 'column' : 'row', alignSelf: 'center' }}>
        <span style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 150 * u, color: INK, lineHeight: 1, alignSelf: 'center' }}>{p.price}</span>
        <span style={{ fontSize: 40 * u, color: MUTED, fontWeight: 600, alignSelf: 'center' }}>{p.priceNote}</span>
      </div>
      <div style={{ marginTop: 18 * u, fontSize: 30 * u, color: MUTED, opacity: interpolate(f, [20, 30], [0, 1], clamp) }}>{p.platforms}</div>
      <div style={{ marginTop: 44 * u, transform: `scale(${btn})`, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 999, boxShadow: `0 0 0 ${pulse * 26 * u}px rgba(46,125,91,${(1 - pulse) * 0.35})` }} />
        <div style={{ position: 'relative', background: p.green, color: '#fff', fontWeight: 600, fontSize: 44 * u, padding: `${24 * u}px ${60 * u}px`, borderRadius: 999, boxShadow: `0 ${18 * u}px ${50 * u}px -${12 * u}px rgba(46,125,91,.7)` }}>{p.button} →</div>
      </div>
    </AbsoluteFill>
  );
};

export const SortedAd: React.FC<SortedProps> = (p) => {
  const frame = useCurrentFrame();
  const flash = interpolate(frame, [S.meet - 2, S.meet, S.meet + 8], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Backdrop dark={0} />
      <Sequence durationInFrames={S.meet}><Hook {...p} /></Sequence>
      <Sequence from={S.meet} durationInFrames={S.cta - S.meet + 10}><Captions {...p} /></Sequence>
      <Sequence from={0} durationInFrames={S.cta + 10}><Sheet {...p} /></Sequence>
      <Sequence from={S.cta}><CTA {...p} /></Sequence>
      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      <Audio src={staticFile('sorted-soundtrack.wav')} />
    </AbsoluteFill>
  );
};
