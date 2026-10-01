"""15-second upbeat track for the Sorted ad. 120 BPM, so one beat = 15 frames at 30 fps.
Cue sheet (seconds): 0 payday sting, 2.0 drain sweep down, 4.0 drop + logo hit ("Meet Sorted"),
6.67/8.17/9.67/11.17 feature ticks, 12.67 CTA chord hit, 15.0 end.
Usage: python3 scripts/sorted_soundtrack.py public/sorted-soundtrack.wav
"""
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR, DUR = 48000, 15.0
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(3)
L = np.zeros(N); R = np.zeros(N)
BEAT = 0.5

def lp(x, f): return sosfilt(butter(2, f, 'low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, 'high', fs=SR, output='sos'), x)
def place(sig, at, gain=1.0, pan=0.0):
    i = int(at * SR); n = min(len(sig), N - i)
    if n <= 0: return
    L[i:i+n] += sig[:n] * gain * (1 - max(0, pan)); R[i:i+n] += sig[:n] * gain * (1 + min(0, pan))
def seg(d): return np.arange(int(d * SR)) / SR

def kick():
    tt = seg(0.45); f = 45 + 110 * np.exp(-tt / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.16)
def clap():
    tt = seg(0.3); n = hp(rng.standard_normal(len(tt)), 900)
    env = np.exp(-tt / 0.06) * (1 + 0.6 * (np.sin(2 * np.pi * 90 * tt) > 0))
    return n * env * 0.5
def hat(open_=False):
    tt = seg(0.2); return hp(rng.standard_normal(len(tt)), 7000) * np.exp(-tt / (0.09 if open_ else 0.025))
def pluck(freqs, d=0.45, bright=3000):
    tt = seg(d); s = sum(np.sign(np.sin(2 * np.pi * f * tt)) * 0.5 + np.sin(2 * np.pi * f * tt) for f in freqs)
    return lp(s * np.exp(-tt / 0.16), bright) / len(freqs)
def bass(f, d=0.48):
    tt = seg(d); s = np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt)
    return s * np.minimum(1, tt / 0.005) * np.exp(-tt / 0.3)
def note(n): return 440 * 2 ** ((n - 69) / 12)

# chords: C, G, Am, F (2 beats each, repeating)
CH = [([60, 64, 67], 36), ([59, 62, 67], 43), ([57, 60, 64], 45), ([57, 60, 65], 41)]

# Intro (0-4 s): soft pad + sting, then the drain sweep
pad = sum(np.sin(2 * np.pi * note(n) * t) for n in (60, 64, 67, 72)) * np.interp(t, [0, 0.3, 1.8, 2.0], [0, 1, 0.8, 0])
L += lp(pad, 1500) * 0.05; R += lp(pad, 1500) * 0.05
place(pluck([note(72), note(76), note(79)], 0.8, 5000), 0.0, 0.5)
place(pluck([note(84)], 0.5, 6000), 0.25, 0.25, 0.4)
tt = seg(2.0); f = 900 * np.exp(-tt * 1.6) + 60
place(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.interp(tt, [0, 0.2, 1.8, 2], [0, .5, .5, 0]), 2.0, 0.35)
place(lp(rng.standard_normal(int(2 * SR)), 1200) * np.interp(seg(2), [0, 1.9, 2], [0.05, 0.6, 0]), 2.0, 0.3)

# Drop at 4 s: full groove until 15 s
for b in range(int(4 / BEAT), int(15 / BEAT)):
    at = b * BEAT; k = b % 4
    place(kick(), at, 0.9)
    if k in (1, 3): place(clap(), at, 0.55)
    place(hat(), at + BEAT / 2, 0.18, 0.3); place(hat(), at, 0.08, -0.3)
    chord, root = CH[(b // 2) % 4]
    place(bass(note(root)), at, 0.45); place(bass(note(root)), at + 0.375, 0.25)
    if b % 2 == 0: place(pluck([note(n) for n in chord]), at, 0.32, -0.2)
    place(pluck([note(chord[(b + 1) % 3] + 12)], 0.2, 5000), at + 0.25, 0.12, 0.35)

# Hits
def boom(at, g=0.9):
    tt = seg(1.2); f = 40 + 90 * np.exp(-tt / 0.08)
    place(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.4), at, g)
    place(hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt / 0.3), at, 0.15)
boom(4.0); place(pluck([note(n) for n in (72, 76, 79, 84)], 1.2, 6000), 4.0, 0.45)
for at in (6.67, 8.17, 9.67, 11.17):
    tt = seg(0.25); place(np.sin(2 * np.pi * 1760 * tt) * np.exp(-tt / 0.05), at, 0.12, 0.2)
boom(12.67, 0.8); place(pluck([note(n) for n in (65, 69, 72, 77)], 1.6, 6000), 12.67, 0.5)

# glue: tiny room, master fade, normalise
ir = rng.standard_normal(int(0.8 * SR)) * np.exp(-np.arange(int(0.8 * SR)) / (0.18 * SR)); ir = lp(ir, 4000); ir /= np.sum(np.abs(ir)) ** 0.5 * 60
L = L + fftconvolve(L, ir)[:N]; R = R + fftconvolve(R, np.roll(ir, 211))[:N]
fade = np.ones(N); fade[-int(0.8 * SR):] = np.linspace(1, 0, int(0.8 * SR))
out = np.stack([L, R]) * fade
out /= np.max(np.abs(out)) / 0.9; out = np.tanh(out * 1.2) / np.tanh(1.2)
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out.T * 32767).astype(np.int16).tobytes())
print('wrote', sys.argv[1])
