# Veylon Auto — promotional films

Five films, each rendered in landscape (16:9, 1920×1080) and portrait (9:16, 1080×1920), 30 fps, H.264 + AAC.

| Film | Audience | Length |
| --- | --- | --- |
| `Master` | Brand film covering car owners and PPF businesses | 1:25 |
| `Luxury` | Premium / luxury car owners | 1:09 |
| `Enthusiast` | Young performance-car enthusiasts | 1:04 |
| `Everyday` | Everyday drivers and families (0€ to compare) | 1:06 |
| `Business` | PPF, ceramic and detailing businesses (growth partner, Egypt) | 1:03 |

All copy, numbers and brand tokens come from [veylonauto.vercel.app](https://veylonauto.vercel.app): colors `#070707 / #f5f3ee / #ff5a1f`, Oswald + Inter, the skewed "V" mark, and the stats (15 studios, 5 cities, 0€ for car owners, €102K monthly client revenue across four Spanish businesses). Contact: `veylonauto.vercel.app` · `+20 104 375 4416`.

Photos are the Unsplash images already used on the website. The soundtrack is original: it is synthesised by `music/compose.py` (no samples), so it's royalty-free.

## Commands

```bash
npm install
pip install -r music/requirements.txt

npm run dev                  # Remotion Studio: preview and scrub every film
npm run music                # regenerate soundtracks (after changing scene timings)
node render.mjs              # render all 10 videos to out/
node render.mjs Business     # render only matching compositions
node stills.mjs out/stills Luxury-9x16   # one review still per scene
```

## Editing

- **Copy, order and timing** live in `src/films.json`. Each film is a list of scenes (`type`, `dur` in frames, music `energy` 0–3, `props`). Shared blocks (stats, steps, services, CTA) sit under `blocks`. `linesP` sets portrait-specific line breaks.
- Keep scene durations in multiples of 30 frames, so cuts land on the 120 BPM beat. Re-run `npm run music` after changing durations.
- Scene components are in `src/scenes/`, and shared UI (photo grade, grain, light sweep, text reveals, brand mark) is in `src/components/ui.tsx`.
- Contact details are in `src/theme.ts` (`CONTACT`).
