# Veylon Auto — promotional films

Five short films, each rendered in landscape (16:9, 1920×1080) and portrait (9:16, 1080×1920), 30 fps, H.264 + AAC.

Every film **opens on the real website**, [veylonauto.vercel.app](https://veylonauto.vercel.app), shown in a 3D browser (landscape) or phone (portrait). The camera starts inside the site's own headline and pulls back, then scrolls the real studio grid, filters to Madrid + PPF, and opens a full studio profile. After that come the hook ("…or become an expensive mistake"), the logo and the call to action.

| Film | Audience | Length |
| --- | --- | --- |
| `Master` | Car owners, then PPF businesses | 0:38 |
| `Luxury` | Premium / luxury car owners | 0:32 |
| `Enthusiast` | Performance-car enthusiasts (fastest cut) | 0:27 |
| `Everyday` | Everyday drivers and families (0€ to compare) | 0:32 |
| `Business` | PPF, ceramic and detailing businesses (growth page, Egypt) | 0:31 |

All copy, numbers and brand tokens come from the website: colors `#070707 / #f5f3ee / #ff5a1f`, Oswald + Inter, the skewed "V" mark, and the stats (15 studios, 5 cities, 0€ for car owners, €102K monthly client revenue across four Spanish businesses). Contact: `veylonauto.vercel.app` · `+20 104 375 4416`.

Car photos are the Unsplash images used on the website. The soundtrack is original: it is synthesised by `music/compose.py` (no samples), so it's royalty-free.

## Commands

```bash
npm install
pip install -r music/requirements.txt

npm run dev                  # Remotion Studio: preview and scrub every film
npm run music                # regenerate soundtracks (after changing scene timings)
node render.mjs              # render all 10 videos to out/
node render.mjs Business     # render only matching compositions
node stills.mjs out/stills Luxury-9x16   # review stills per scene
```

### Refreshing the website footage

When the site changes, recapture it and re-export the assets:

```bash
node capture/capture-site.mjs      # writes capture/shots/ (desktop @2x, mobile @3x)
python3 capture/export.py          # writes public/site/*.jpg
```

The camera targets in `src/scenes/SiteScenes.tsx` (filter dropdowns, the Diamond Details card, scroll stops) are in the site's CSS pixels. If the layout moves, update `FILTER_POS`, `PROFILE_POS` and `SCROLL`.

## Editing

- **Copy, order and timing** live in `src/films.json`. Each film is a list of scenes (`type`, `dur` in frames, music `energy` 0–3, `props`). `linesP` sets portrait-specific line breaks.
- Website scene types: `siteHero`, `siteScroll`, `siteFilter`, `siteProfile`, `sitePan` (in `src/scenes/SiteScenes.tsx`). Story scenes (`scratch`, `logo`, `cta`, `photo`, …) are in `src/scenes/`.
- Keep scene durations in multiples of 15 frames, so cuts land on the 120 BPM beat. Re-run `npm run music` after changing durations.
- Contact details are in `src/theme.ts` (`CONTACT`).
