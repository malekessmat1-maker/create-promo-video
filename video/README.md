# Veylon Auto — promotional films (Egypt)

Five films, each rendered in landscape (16:9, 1920×1080) and portrait (9:16, 1080×1920), 30 fps, H.264 + AAC.

Every film **opens on the Veylon website**, shown in a 3D browser (landscape) or phone (portrait). The camera starts inside the headline and pulls back. Then it scrolls the studio shortlist, opens the **City** dropdown and picks **Cairo**, opens **Treatment** and picks **PPF**, and taps a studio card that expands into its full profile. After that come Egypt (Cairo · Alexandria · Giza), the craft (PPF · Ceramic · Detailing · Window tint · Wrapping), the hook ("…or become an expensive mistake"), the logo and the call to action.

| Film | Audience | Length |
| --- | --- | --- |
| `Master` | Car owners, then PPF businesses | 0:42 |
| `Luxury` | Premium / luxury car owners | 0:35 |
| `Enthusiast` | Performance-car enthusiasts | 0:31 |
| `Everyday` | Everyday drivers and families (0 EGP to compare) | 0:35 |
| `Business` | PPF, ceramic and detailing businesses (growth page) | 0:33 |

Contact on the end card: `veylonauto.vercel.app` · `+20 104 375 4416`.

## About the website screens

The live site currently lists Spanish studios, so the films use an **Egypt-localised rebuild of the site's design** (`src/site/SiteUI.tsx`): the same layout, typography and colours, with Egyptian cities (Cairo, Alexandria, Giza, Sheikh Zayed, 6th of October, Mansoura) and EGP.

- Studio cards are **illustrative**. They show a specialty and an area, never invented business names, ratings or prices.
- The end card carries a small "Website screens are illustrative." line.
- The one hard number, **€102K in monthly client revenue across four partner businesses**, is the real result stated on the live site.

## Photography

All photos are from [Unsplash](https://unsplash.com/license) (free for commercial use): Cairo (Cairo Tower skyline, the Nile), Alexandria (Qaitbay Citadel), Giza (the pyramids), PPF and detailing work, and premium cars. They're in `public/img/`.

## Commands

```bash
npm install
pip install -r music/requirements.txt

npm run dev                  # Remotion Studio: preview and scrub every film
npm run music                # regenerate the original score (after changing timings)
node render.mjs              # render all 10 videos to out/
node render.mjs Business     # render only matching compositions
node stills.mjs out/stills Luxury-9x16   # review stills per scene
```

## Editing

- **Copy, order and timing** live in `src/films.json`. Each film is a list of scenes (`type`, `dur` in frames, music `energy` 0–3, `props`).
- **Website content** (cities, cards, sections) lives in `src/site/SiteUI.tsx`. Its layout constants (`L`) drive the camera and cursor targets in `src/scenes/SiteScenes.tsx`.
- Keep scene durations in multiples of 15 frames, so cuts land on the 120 BPM beat. Re-run `npm run music` after changing durations.
- Contact details are in `src/theme.ts` (`CONTACT`).
