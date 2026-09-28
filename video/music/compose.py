"""
Original score generator for the Veylon Auto films.

Everything is synthesised from scratch (no samples), so the soundtrack is
royalty-free. The arrangement follows each film's edit from src/films.json:
energy per scene drives the layers, and scene types trigger sound design
(risers into the logo, the scratch sting, UI clicks, typing, end-card hit).

Usage: python3 music/compose.py            # all films
       python3 music/compose.py Luxury     # one film
"""
import json
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SR = 44100
FPS = 30
BPM = 120
BEAT = 60 / BPM  # 0.5 s
BAR = 4 * BEAT  # 2 s
rng = np.random.default_rng(20260927)

# D minor: i - VI - III - VII  (Dm, Bb, F, C), one chord per bar.
PAD_CHORDS = [[50, 53, 57, 62], [46, 50, 53, 58], [45, 48, 53, 57], [48, 52, 55, 60]]
BASS_ROOTS = [38, 34, 41, 36]
ARP_CHORDS = [[62, 65, 69, 74], [58, 62, 65, 70], [65, 69, 72, 77], [60, 64, 67, 72]]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def t_(sec):
    return np.arange(int(sec * SR)) / SR


def add(buf, at_sec, sig, gain=1.0):
    i = int(round(at_sec * SR))
    if i >= len(buf):
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    n = min(len(sig), len(buf) - i)
    buf[i:i + n] += sig[:n] * gain


# ---------------------------------------------------------------- instruments
def pad_note(freq, dur, bright):
    t = t_(dur)
    out = np.zeros_like(t)
    for det in (-0.07, 0.0, 0.07):
        f = freq * 2 ** (det / 12)
        ph = rng.uniform(0, 2 * np.pi)
        for n in range(1, 14):
            if f * n > 9000:
                break
            out += np.sin(2 * np.pi * f * n * t + ph * n) / n ** (1.35 - 0.25 * bright)
    return out / 9


def pad_chord(notes, dur, bright):
    sig = sum(pad_note(hz(m), dur, bright) for m in notes)
    att, rel = 0.35, 0.7
    env = np.ones_like(sig)
    a = int(att * SR)
    r = int(rel * SR)
    env[:a] = np.linspace(0, 1, a) ** 1.5
    env[-r:] *= np.linspace(1, 0, r) ** 1.5
    return sig * env


def kick():
    t = t_(0.45)
    f = 48 + 110 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 7.5)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 180) * 0.25
    return np.tanh((body + click) * 1.6) * 0.9


def hat(decay=55, level=1.0):
    t = t_(0.12)
    n = hp(rng.standard_normal(len(t)), 7500, 4)
    return n * np.exp(-t * decay) * 0.22 * level


def tick():
    t = t_(0.05)
    return (np.sin(2 * np.pi * 3200 * t) * 0.3 + hp(rng.standard_normal(len(t)), 5000) * 0.5) * np.exp(-t * 160) * 0.35


def clap():
    t = t_(0.35)
    n = bp(rng.standard_normal(len(t)), 900, 3200)
    env = np.exp(-t * 16)
    for d in (0.0, 0.011, 0.022):
        i = int(d * SR)
        env[i:i + int(0.006 * SR)] += 0.8
    return n * env * 0.28


def bass_note(midi, dur, level=1.0):
    t = t_(dur)
    f = hz(midi)
    sig = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(4 * np.pi * f * t) + 0.12 * np.sin(6 * np.pi * f * t)
    env = np.minimum(1, t / 0.006) * np.exp(-t * 3.2)
    return np.tanh(sig * env * 1.4) * 0.55 * level


def pluck(midi, dur=0.35):
    t = t_(dur)
    f = hz(midi)
    sig = sum(np.sin(2 * np.pi * f * n * t) / n for n in range(1, 7))
    return lp(sig * np.exp(-t * 11) * np.minimum(1, t / 0.003), 4200) * 0.16


def boom(level=1.0, length=2.2):
    t = t_(length)
    f = 36 + 40 * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    low = np.sin(ph) * np.exp(-t * 2.2)
    noise = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 9) * 0.6
    return np.tanh((low + noise) * 1.8) * 0.8 * level


def riser(length=2.0, level=1.0):
    t = t_(length)
    x = t / length
    n = rng.standard_normal(len(t))
    # sweep a band-pass upward in chunks
    out = np.zeros_like(t)
    chunks = 40
    for c in range(chunks):
        a, b = c * len(t) // chunks, (c + 1) * len(t) // chunks
        centre = 300 * (18 ** (c / chunks))
        out[a:b] = bp(n[max(0, a - 2000):b], centre * 0.6, min(centre * 1.6, 18000))[-(b - a):]
    tone = np.sin(2 * np.pi * np.cumsum(220 + 660 * x ** 2) / SR) * 0.15
    return (out * 0.5 + tone) * x ** 2.2 * level


def whoosh(length=0.45, level=1.0):
    t = t_(length)
    x = t / length
    n = bp(rng.standard_normal(len(t)), 500, 6000)
    env = np.sin(np.pi * x) ** 2 * x
    return n * env * 0.35 * level


def scratch_sfx():
    t = t_(0.42)
    x = t / 0.42
    f = 5200 - 3400 * x
    ph = 2 * np.pi * np.cumsum(f + 900 * np.sin(2 * np.pi * 47 * t)) / SR
    squeal = np.sin(ph) * 0.35
    grit = bp(rng.standard_normal(len(t)), 1800, 9000) * 0.8
    env = np.minimum(1, t / 0.01) * np.exp(-t * 6)
    return np.tanh((squeal + grit) * env * 2.2) * 0.55


def ui_click():
    t = t_(0.04)
    return (np.sin(2 * np.pi * 2200 * t) * 0.5 + hp(rng.standard_normal(len(t)), 3000)) * np.exp(-t * 220) * 0.3


def key_click():
    t = t_(0.03)
    return bp(rng.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 260) * 0.22


def reverb_ir(length=2.4):
    t = t_(length)
    ir = np.stack([rng.standard_normal(len(t)), rng.standard_normal(len(t))], axis=1)
    ir *= np.exp(-t * 3.0)[:, None]
    ir[:, 0] = lp(ir[:, 0], 6000)
    ir[:, 1] = lp(ir[:, 1], 6000)
    return ir / np.sqrt((ir ** 2).sum(axis=0))


# ---------------------------------------------------------------- arrangement
def compose(name, film):
    scenes = film['scenes']
    total = sum(s['dur'] for s in scenes) / FPS
    n = int((total + 3) * SR)
    drums = np.zeros(n)
    bass = np.zeros(n)
    pad_dark = np.zeros(n)
    pad_bright = np.zeros(n)
    arp = np.zeros(n)
    fx = np.zeros(n)
    fx_verb = np.zeros(n)

    # energy per beat
    beats = int(np.ceil(total / BEAT))
    energy = np.zeros(beats)
    starts = []
    t0 = 0.0
    for s in scenes:
        dur = s['dur'] / FPS
        starts.append(t0)
        b0, b1 = int(round(t0 / BEAT)), int(round((t0 + dur) / BEAT))
        energy[b0:b1] = s['energy']
        if s['type'] == 'cta':
            sw = s['props'].get('switchAt', 105) / FPS
            energy[int(round((t0 + sw) / BEAT)):b1] = 1
        if s['type'] == 'scratch':
            hit = s['props'].get('hitAt', 30) / FPS
            energy[int(round((t0 + hit) / BEAT)):b1] = 1
        if s['type'] == 'siteHero':
            rv = s['props'].get('revealAt', 60) / FPS
            energy[b0:int(round((t0 + rv) / BEAT))] = 1
        t0 += dur

    def e_at(sec):
        return energy[min(beats - 1, max(0, int(sec / BEAT)))]

    # pads: one chord per bar; brightness by energy
    bars = int(np.ceil(total / BAR))
    for b in range(bars):
        at = b * BAR
        e = e_at(at)
        if e <= 0:
            continue
        chord = PAD_CHORDS[b % 4]
        sig = pad_chord(chord, BAR + 0.7, bright=min(1, e / 3))
        add(pad_dark, at, sig, 0.9 if e < 2 else 0.6)
        if e >= 2:
            add(pad_bright, at, sig, 0.35 + 0.15 * (e - 2))

    pad_dark = lp(pad_dark, 900)
    pad_bright = lp(pad_bright, 3200)

    kick_env = np.zeros(n)
    k = kick()
    for i in range(beats):
        at = i * BEAT
        e = energy[i]
        bar = int(at / BAR) % 4
        beat_in_bar = i % 4
        root = BASS_ROOTS[bar]
        if e >= 2:
            add(drums, at, k, 0.95)
            add(kick_env, at, np.exp(-t_(0.3) * 14))
            # offbeat hats
            add(drums, at + BEAT / 2, hat(level=1.0 if e >= 3 else 0.7))
            # 8th-note bass pulse (16ths at full energy for drive)
            steps = 4 if e >= 3 else 2
            for j in range(steps):
                add(bass, at + j * BEAT / steps, bass_note(root + (12 if (e >= 3 and j == 3) else 0), BEAT / steps + 0.04, 1.0 if j == 0 else 0.8))
        elif e >= 1:
            add(drums, at, tick(), 0.9 if beat_in_bar == 0 else 0.55)
            if beat_in_bar == 0:
                add(bass, at, bass_note(root, BAR, 0.55))
        if e >= 3:
            for j in (1, 3):
                add(drums, at + j * BEAT / 4, hat(decay=90, level=0.45))
            if beat_in_bar in (1, 3):
                add(drums, at, clap())
            notes = ARP_CHORDS[bar]
            pattern = [0, 2, 1, 3]
            for j in range(4):
                add(arp, at + j * BEAT / 4, pluck(notes[pattern[(i * 4 + j) % 4]]))

    # dotted-eighth delay on the arp
    d = int(0.375 * SR)
    delayed = np.zeros(n)
    for rep in range(1, 4):
        delayed[d * rep:] += arp[:-d * rep] * (0.38 ** rep)
    arp = arp + lp(delayed, 2500)

    # sound design
    for s, at in zip(scenes, starts):
        dur = s['dur'] / FPS
        typ = s['type']
        p = s['props']
        if typ == 'logo':
            add(fx, at - 2.0, riser(2.0), 0.55)
            add(fx_verb, at, boom(1.0), 0.9)
        elif typ == 'scratch':
            hit = at + p.get('hitAt', 30) / FPS
            add(fx, hit - 0.35, whoosh(0.35), 0.8)
            add(fx, hit, scratch_sfx(), 0.9)
            add(fx_verb, hit, boom(0.8, 1.6), 0.8)
        elif typ == 'cta':
            sw = at + p.get('switchAt', 105) / FPS
            add(fx, sw - 1.5, riser(1.5), 0.4)
            add(fx_verb, sw, boom(1.0, 3.0), 1.0)
            # final sustained chord
            chord = pad_chord([38, 50, 57, 62, 65], total - sw + 2.5, bright=0.6)
            add(fx_verb, sw, lp(chord, 2200), 0.5)
        elif typ == 'services':
            count = len(p.get('items', [])) or 5
            each = int(s['dur'] / count) / FPS
            for k_ in range(count):
                add(fx, at + k_ * each - 0.3, whoosh(0.3), 0.6)
                add(fx_verb, at + k_ * each, boom(0.25, 0.8), 0.6)
        elif typ == 'siteHero':
            rv = p.get('revealAt', 60) / FPS
            add(fx, at, riser(rv), 0.55)
            add(fx_verb, at + rv, boom(1.0, 2.4), 1.0)
            url = 'veylonauto.vercel.app'
            for c in range(len(url)):
                add(fx, at + rv + (-4 + c * 30 / len(url)) / FPS, key_click(), 0.7)
        elif typ == 'siteScroll':
            n_stops = len(p.get('stops') or p.get('captions') or [0])
            seg = int(s['dur'] / n_stops) / FPS
            for k_ in range(n_stops):
                add(fx, at + k_ * seg, whoosh(0.55, 1.1), 0.7)
        elif typ == 'siteFilter':
            for fr in (30, 58):
                add(fx, at + fr / FPS, ui_click(), 1.0)
        elif typ == 'siteProfile':
            add(fx, at + 26 / FPS, ui_click(), 1.0)
            add(fx, at + 28 / FPS, whoosh(0.5, 1.2), 0.8)
            add(fx_verb, at + 30 / FPS, boom(0.3, 0.8), 0.6)
        elif typ == 'filter':
            for fr in (62, 108):
                add(fx, at + fr / FPS, ui_click(), 1.0)
        elif typ == 'search':
            q = p.get('query', '')
            for c in range(len(q)):
                add(fx, at + (24 + c * 1.6) / FPS, key_click(), 0.8 + 0.4 * rng.random())
        elif typ in ('bignumber',):
            add(fx_verb, at + 58 / FPS, boom(0.35, 1.0), 0.6)
        elif typ == 'beforeafter':
            add(fx, at + 60 / FPS, whoosh(0.6, 1.2), 0.7)
        if typ not in ('logo', 'scratch', 'siteHero') and at > 0:
            add(fx, at - 0.35, whoosh(0.35), 0.35)

    # sidechain pads + bass under the kick
    duck = 1 - 0.55 * np.clip(kick_env, 0, 1)
    music = pad_dark + pad_bright
    music = music * duck
    bass = bass * (1 - 0.35 * np.clip(kick_env, 0, 1))

    ir = reverb_ir()
    send = (music * 0.5 + arp * 0.6 + fx_verb * 0.7)
    wet = np.stack([fftconvolve(send, ir[:, c])[:n] for c in range(2)], axis=1)

    mono = music * 0.8 + bass * 0.9 + drums * 0.85 + arp * 0.7 + fx * 0.9 + fx_verb * 0.8
    # slight stereo width: pads/arps offset
    left = mono + 0.12 * np.roll(music + arp, int(0.011 * SR))
    right = mono + 0.12 * np.roll(music + arp, int(0.017 * SR))
    mix = np.stack([left, right], axis=1) + wet * 0.35

    mix[:, 0] = hp(mix[:, 0], 28)
    mix[:, 1] = hp(mix[:, 1], 28)

    # fade out at the end of the film
    end = int(total * SR)
    fade = int(1.4 * SR)
    mix[end - fade:end] *= np.linspace(1, 0, fade)[:, None] ** 1.5
    mix = mix[:end]

    # glue with a gentle soft clip, then normalise to -14 LUFS (YouTube/TikTok/Instagram
    # reference) with peaks kept under -1 dBFS.
    rms = np.sqrt(np.mean(mix ** 2))
    mix *= 0.2 / max(rms, 1e-9)
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    meter = pyln.Meter(SR)
    mix *= 10 ** ((-14.0 - meter.integrated_loudness(mix)) / 20)
    peak = np.max(np.abs(mix))
    if peak > 0.89:
        mix *= 0.89 / peak

    out = ROOT / 'public' / 'audio' / f'{name.lower()}.wav'
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    print(f'{name}: {total:.1f}s -> {out.relative_to(ROOT)}  ({pyln.Meter(SR).integrated_loudness(mix):.1f} LUFS, peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS)')


if __name__ == '__main__':
    data = json.loads((ROOT / 'src' / 'films.json').read_text())
    names = sys.argv[1:] or list(data['films'])
    for nm in names:
        compose(nm, data['films'][nm])
