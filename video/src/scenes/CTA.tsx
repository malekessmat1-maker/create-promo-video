import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {C, CONTACT, F, useLayout} from '../theme';
import {Body, BrandMark, Eyebrow, Flash, Grain, LightSweep, LineReveal, LineSpec, Photo, PhotoSpec, useSpring, Vignette, Wordmark} from '../components/ui';

export type CTAProps = {
  photo: PhotoSpec;
  eyebrow?: string;
  lines: LineSpec[];
  linesP?: LineSpec[];
  body?: string;
  /** Small label above the phone number, e.g. "Call · WhatsApp". */
  phoneLabel: string;
  /** Frame at which the end card replaces the closing statement. */
  switchAt?: number;
  endLine?: string;
};

export const CTA: React.FC<CTAProps & {dur: number}> = ({photo, eyebrow, lines, linesP, body, phoneLabel, switchAt = 105, endLine, dur}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const statementOut = interpolate(frame, [switchAt - 12, switchAt], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const photoDim = interpolate(frame, [switchAt - 12, switchAt + 10], [1, 0.22], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const endFade = interpolate(frame, [dur - 18, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <AbsoluteFill style={{opacity: photoDim}}>
        <Photo photo={photo} dur={dur} zoom={[1.06, 1.16]} brightness={0.62} />
      </AbsoluteFill>

      {/* Phase 1: closing statement */}
      {frame < switchAt ? (
        <AbsoluteFill
          style={{
            opacity: statementOut,
            justifyContent: 'center',
            alignItems: 'center',
            padding: portrait ? `${200 * u}px ${70 * u}px` : `${100 * u}px ${140 * u}px`,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 30 * u}}>
            {eyebrow ? <Eyebrow text={eyebrow} size={24 * u} delay={4} align="center" /> : null}
            <LineReveal lines={portrait && linesP ? linesP : lines} size={(portrait ? 112 : 136) * u} delay={8} align="center" stagger={6} fitWidth={(portrait ? 920 : 1640) * u} />
            {body ? <Body text={body} size={(portrait ? 36 : 34) * u} delay={28} align="center" maxWidth={portrait ? 900 * u : 1100 * u} /> : null}
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Phase 2: end card */}
      <Sequence from={switchAt}>
        <EndCard phoneLabel={phoneLabel} endLine={endLine} />
      </Sequence>

      <LightSweep start={switchAt + 30} duration={44} opacity={0.3} width={10} />
      <Flash at={switchAt} color={C.orange} peak={0.25} length={12} />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{backgroundColor: '#000', opacity: 1 - endFade}} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{phoneLabel: string; endLine?: string}> = ({phoneLabel, endLine}) => {
  const frame = useCurrentFrame();
  const {u, portrait} = useLayout();
  const draw = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const word = useSpring(12, 200, 24);
  const url = useSpring(26, 200, 22);
  const phone = useSpring(36, 200, 22);
  const line = useSpring(48, 200, 22);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: portrait ? `${200 * u}px ${60 * u}px ${300 * u}px` : 0}}>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: (portrait ? 44 : 36) * u}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 30 * u, flexDirection: portrait ? 'column' : 'row'}}>
          <BrandMark size={(portrait ? 120 : 104) * u} draw={draw} />
          <div style={{opacity: word, transform: `translateX(${(1 - word) * 30}px)`}}>
            <Wordmark size={(portrait ? 96 : 110) * u} />
          </div>
        </div>
        <div style={{fontFamily: F.body, fontWeight: 500, fontSize: (portrait ? 36 : 32) * u, color: C.muted, opacity: word}}>Protection, compared.</div>

        <div
          style={{
            marginTop: 20 * u,
            opacity: url,
            transform: `translateY(${(1 - url) * 24}px)`,
            background: C.orange,
            color: '#140600',
            borderRadius: 999,
            padding: `${(portrait ? 28 : 24) * u}px ${(portrait ? 50 : 56) * u}px`,
            fontFamily: F.body,
            fontWeight: 700,
            fontSize: (portrait ? 46 : 46) * u,
            letterSpacing: '0.01em',
            boxShadow: `0 ${20 * u}px ${80 * u}px rgba(255,90,31,.35)`,
            whiteSpace: 'nowrap',
          }}
        >
          {CONTACT.url}
        </div>

        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u, opacity: phone, transform: `translateY(${(1 - phone) * 24}px)`}}>
          <div style={{fontFamily: F.body, fontWeight: 700, fontSize: (portrait ? 24 : 22) * u, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.orange}}>{phoneLabel}</div>
          <div style={{fontFamily: F.display, fontWeight: 600, fontSize: (portrait ? 84 : 78) * u, color: C.paper, letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>{CONTACT.phone}</div>
        </div>

        {endLine ? (
          <div style={{fontFamily: F.body, fontWeight: 500, fontSize: (portrait ? 28 : 24) * u, color: C.muted, letterSpacing: '0.04em', opacity: line, textAlign: 'center'}}>{endLine}</div>
        ) : null}
      </div>
      <div style={{position: 'absolute', bottom: (portrait ? 150 : 40) * u, left: 0, right: 0, textAlign: 'center', fontFamily: F.body, fontSize: (portrait ? 18 : 16) * u, color: 'rgba(245,243,238,.42)', opacity: line}}>
        Website screens are illustrative.
      </div>
    </AbsoluteFill>
  );
};
