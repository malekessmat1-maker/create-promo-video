"""Synthesises the 20-second HADAL soundtrack from scratch (no samples, no licences).

Cue sheet (seconds, 30 fps frames in brackets):
  0.15 [5]    sonar ping           hook
  1.70 [51]   second ping
  2.60 [78]   splash + dive rumble descent begins
  6.60 [198]  sub boom             Lumen-6 reveal
  6.95/7.10   floodlight clunks
  11.0/12.6   feature ticks
  14.2 [426]  lights-off thunk + bioluminescent shimmer
  16.0 [480]  final hit + pad      call to action
Usage: python3 scripts/soundtrack.py public/soundtrack.wav
"""
import sys, wave
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
DUR = 20.0
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
mix = np.zeros((2, N))


def env(start, attack, decay, length=None):
    """Attack/exponential-decay envelope placed at `start` seconds."""
    e = np.zeros(N)
    i0 = int(start * SR)
    L = int((length or (attack + decay * 6)) * SR)
    L = min(L, N - i0)
    tt = np.arange(L) / SR
    a = np.clip(tt / max(attack, 1e-4), 0, 1)
    d = np.exp(-np.maximum(tt - attack, 0) / decay)
    e[i0:i0 + L] = a * d
    return e


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(sig, gain=1.0, pan=0.0):
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    mix[0] += sig * gain * l * 1.414
    mix[1] += sig * gain * r * 1.414


def ping(at, freq=1250, gain=0.22, pan=0.0):
    e = env(at, 0.004, 0.22, 2.0)
    s = np.sin(2 * np.pi * freq * t * (1 - 0.01 * np.clip(t - at, 0, 2))) * e
    s += 0.3 * np.sin(2 * np.pi * freq * 2.01 * t) * env(at, 0.002, 0.06, 0.6)
    # sonar echo taps
    for k, (dly, g) in enumerate([(0.42, 0.45), (0.84, 0.25), (1.26, 0.13)]):
        sh = int(dly * SR)
        echo = np.zeros(N); echo[sh:] = s[:-sh]
        add(lp(echo, 2600), gain * g, pan=(-1) ** k * 0.6)
    add(s, gain, pan)


def boom(at, f0=58, f1=32, gain=0.9, decay=0.9):
    e = env(at, 0.005, decay, 5)
    tt = np.clip(t - at, 0, None)
    freq = f1 + (f0 - f1) * np.exp(-tt / 0.25)
    phase = 2 * np.pi * np.cumsum(freq) / SR
    s = np.sin(phase) * e
    click = lp(rng.standard_normal(N), 900) * env(at, 0.001, 0.03, 0.3)
    add(s + 0.6 * click, gain)


def clunk(at, gain=0.35, pan=0.0):
    n = bp(rng.standard_normal(N), 180, 1800) * env(at, 0.001, 0.035, 0.4)
    tone = np.sin(2 * np.pi * 140 * t) * env(at, 0.001, 0.08, 0.5)
    add(n + 0.5 * tone, gain, pan)


# 1. Underwater bed: brown noise through a slowly breathing low-pass, rising through the descent
white = rng.standard_normal(N)
brown = np.cumsum(white); brown -= np.convolve(brown, np.ones(4800) / 4800, mode='same'); brown /= np.max(np.abs(brown))
bed_env = np.interp(t, [0, 2.6, 4.5, 6.6, 9, 16, 18.5, 20], [0.18, 0.25, 0.75, 0.95, 0.5, 0.45, 0.35, 0.0])
bed = lp(brown, 420) * bed_env
add(bed, 0.75, -0.2)
add(lp(np.roll(brown, 9000), 380) * bed_env, 0.75, 0.2)

# 2. Drone: two detuned low sines plus a fifth, with a slow swell
drone_env = np.interp(t, [0, 1, 6.6, 7.5, 14, 16, 19, 20], [0, 0.35, 0.55, 0.8, 0.7, 0.9, 0.6, 0])
drone = (np.sin(2 * np.pi * 55 * t) + np.sin(2 * np.pi * 55.4 * t) + 0.35 * np.sin(2 * np.pi * 82.4 * t + 0.5 * np.sin(2 * np.pi * 0.2 * t)))
add(drone * drone_env, 0.16)

# 3. Descent: splash transient, then a rising pressure rumble and an airy whoosh sweep
add(hp(rng.standard_normal(N), 1200) * env(2.6, 0.01, 0.18, 1.2), 0.32)
whoosh = bp(rng.standard_normal(N), 300, 2400) * np.interp(t, [2.6, 4.0, 6.3, 6.6, 7.2], [0, 0.25, 0.6, 0.15, 0])
add(whoosh, 0.35, 0.0)
riser_f = np.interp(t, [2.6, 6.6], [180, 70])
riser = np.sin(2 * np.pi * np.cumsum(riser_f) / SR) * np.interp(t, [2.6, 5.5, 6.5, 6.7], [0, 0.4, 0.7, 0])
add(riser, 0.22)

# 4. Hits and pings
ping(0.15, 1250, 0.24)
ping(1.7, 1180, 0.18, pan=0.3)
boom(6.6, gain=1.0)
clunk(6.95, 0.4, -0.5); clunk(7.12, 0.4, 0.5)
ping(9.2, 980, 0.1, pan=-0.4)
for at, f in [(11.0, 1500), (12.6, 1320)]:
    ping(at, f, 0.12, pan=0.2)
    boom(at, f0=70, f1=45, gain=0.35, decay=0.35)
clunk(14.2, 0.45); boom(14.2, f0=48, f1=30, gain=0.5, decay=0.6)

# 5. Bioluminescence shimmer: high, slow-trembling partials
sh_env = np.interp(t, [14.2, 14.8, 16.0, 17.5, 20], [0, 0.6, 0.5, 0.25, 0])
shimmer = sum(np.sin(2 * np.pi * f * t + p) * (0.5 + 0.5 * np.sin(2 * np.pi * r * t + p))
              for f, r, p in [(2093, 3.1, 0), (2637, 2.3, 1), (3136, 4.2, 2), (3951, 1.7, 3), (1568, 2.9, 4)])
add(shimmer * sh_env, 0.028, 0.3)

# 6. Final hit + warm pad (A minor add 9), held to the end
boom(16.0, f0=60, f1=30, gain=1.1, decay=1.2)
pad_env = np.interp(t, [15.95, 16.4, 18.5, 20], [0, 1, 0.8, 0])
pad = np.zeros(N)
for f in [110, 164.81, 220, 246.94, 261.63, 329.63]:
    for det in (-0.6, 0.6):
        pad += np.sin(2 * np.pi * (f + det) * t + rng.uniform(0, 6.28))
add(lp(pad, 1400) * pad_env, 0.045)
ping(16.05, 1250, 0.16)

# 7. Room: short dark reverb from a decaying-noise impulse response
ir_len = int(2.4 * SR)
ir = rng.standard_normal(ir_len) * np.exp(-np.arange(ir_len) / (0.55 * SR))
ir = lp(ir, 3000); ir /= np.sum(np.abs(ir)) ** 0.5 * 40
wet = np.stack([fftconvolve(mix[0], ir)[:N], fftconvolve(mix[1], np.roll(ir, 331))[:N]])
out = mix + 0.9 * wet

# Fade, normalise, soft-clip
fade = np.ones(N); fade[:int(0.02 * SR)] = np.linspace(0, 1, int(0.02 * SR)); fade[-int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
out *= fade
out /= np.max(np.abs(out)) / 0.89
out = np.tanh(out * 1.1) / np.tanh(1.1)
pcm = (out.T * 32767).astype(np.int16)
with wave.open(sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav')
