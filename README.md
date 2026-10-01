# Create Promo Video Skill

This is a **Claude** skill that helps you automatically generate promotional short videos for your software projects using [Remotion](https://www.remotion.dev/).

## What it does

Here's a quick example of what this skill enable. I asked it to generate the video for the actual skill.

![Promo Video Demo](promo.gif)


This skill acts as an expert videographer and motion designer. It:
1.  **Analyzes your project** to understand its core functionality and selling points.
2.  **Extracts branding** (colors, fonts, logos) from your existing codebase.
3.  **Generates a Remotion video project** in a `video/` subfolder.
4.  **Creates a professional composition** with a hook, product showcase, and call to action.
5.  **Renders the final video** in your preferred format:
    *   **Portrait (9x16)** for TikTok, Shorts, Reels.
    *   **Landscape (16x9)** for YouTube, Twitter/X, LinkedIn.

## Installation

You can install this skill directly using the `findskill` CLI:

```bash
npx findskill install create-promo-video
```

Or just download this repo and add it to your favourite `.agent-cli/skills` folder (e.g. `.codex/skills/` `.gemini/skills`)


## Usage

Once installed, you can activate the skill in your Claude Code session to start generating videos for your current project.

```text
hei claude let's make  a promo video for this project
```

## Interactive Editing
    
You get full control over the output. The skill sets up a local Remotion Studio where you can:
    
-   **Preview changes live** in the browser.
-   **Tweak props** (text, colors) using visual controls.
-   **Modify the code** directly if you need custom animations or layouts.



## Showcase: Sorted (a real product you can sell from home)

`sorted/` is a complete, low-cost online business made with this repo: a digital budget-planner spreadsheet, its sales website, a 15-second ad, and a launch plan.

| Folder | What's in it |
|---|---|
| `sorted/product/Sorted-Budget-Planner.xlsx` | **The product.** 7 tabs (Start Here, Setup, Transactions, This Month, Year Dashboard, Debt Payoff, Savings Goals). 6,880 formulas with zero errors, dropdowns and charts. Works in Excel, Google Sheets and Numbers, in any currency. |
| `sorted/scripts/build_planner.py` | Rebuilds the spreadsheet. Change `YEAR`, categories or colours and re-run it. |
| `sorted/site/` | The sales page: an animated 3D spreadsheet preview, a working 50/30/20 calculator, a debt-free-date calculator, a tour of the tabs, pricing and FAQ. Paste your checkout link into `CHECKOUT_URL`. |
| `ads/sorted-ad-*.mp4` | The ad in 16:9 and 9:16, 15 s with an original soundtrack. Source in `video/src/sorted/`. Compositions `SortedLandscape` and `SortedPortrait`. |
| `sorted/marketing/` | Listing and pin images taken from the ad. |
| `sorted/LAUNCH-PLAN.md` | Startup costs (under $20), profit per sale on each platform, a ready-to-paste Etsy listing, and a 4-week marketing plan. |

```bash
python3 sorted/scripts/build_planner.py sorted/product/Sorted-Budget-Planner.xlsx   # rebuild the product
npx http-server sorted/site -p 4174                                                   # preview the store
cd video && npx remotion render src/index.ts SortedPortrait out/sorted-ad-portrait.mp4  # re-render the ad
```

## Showcase: HADAL (website + ad made with this repo)

`site/` and `video/` hold a complete example: a made-up deep-sea expedition brand called **HADAL**, with a 3D website and a 20-second ad built from the same 3D assets.

### `site/`: 3D scroll-driven website

Scrolling down the page takes you down through the ocean. A WebGL scene (Three.js) sits behind the page:

- **Scroll = depth.** Each section has a real depth (0 m → 4,000 m). The camera follows it down, and the water colour, fog, sunlight and sound change as you go.
- **Lumen‑6 submersible.** Built from Three.js primitives: an acrylic sphere with transmission, six seats, thrusters with spinning props, a strobe and volumetric floodlights. It follows you down with inertia, tilts with scroll speed, and responds to the mouse.
- **Ocean life.** Caustics and god rays at the surface, a school of fish, procedural jellyfish with pulsing shader bells and swaying tentacles, a long glowing siphonophore, plankton that lights up near the cursor, an anglerfish lure, and a seafloor with tube worms.
- **Live depth gauge.** Shows depth, pressure (atm), water temperature, sunlight % and the current ocean zone.
- **Interactions.** Floodlight switch (Auto / On / Off), 3D tilt cards, magnetic buttons, a custom cursor, a dive-log carousel, a booking form with live pricing, seat availability and charter discount, an FAQ, and an "Ascend to the surface" button.
- **Generated sound.** A WebAudio ocean bed with sonar pings; the low-pass filter closes as you go deeper. Turn it on with the button in the nav.
- **Handles phones and accessibility.** Lighter 3D on phones, `prefers-reduced-motion` support, and a fallback that removes the loader if the 3D CDN can't load.

Run it locally:

```bash
npx http-server site -p 4173 -c-1   # then open http://localhost:4173
```

### `video/`: the ad (Remotion + react-three-fiber)

A 20-second film in two formats: `PromoLandscape` (1920×1080) and `PromoPortrait` (1080×1920). It uses the same submersible and jellyfish code as the site, rendered in 3D for every frame.

| Time | Beat |
|---|---|
| 0–2.6 s | Hook over black, with sonar pings: "80% of the ocean has never been seen." |
| 2.6–6.6 s | Drop from the surface to 1,000 m with a live depth / pressure / temperature readout |
| 6.6–11 s | Lumen‑6 appears out of the dark and its floodlights flicker on |
| 11–16 s | Three feature beats: 165 mm acrylic · rated to 4,000 m · lights off, bioluminescence |
| 16–20 s | End card: HADAL, "Go deeper than daylight.", price, call to action |

The soundtrack (`video/public/soundtrack.wav`) is synthesised by `video/scripts/soundtrack.py` from noise and sine waves: no samples and no licensing. Its cue sheet matches the video frames.

```bash
cd video
npm install
npm run dev          # Remotion Studio: edit all the copy and colours live (Zod schema)
npm run soundtrack   # regenerate the soundtrack
npm run render       # renders out/hadal-ad-landscape.mp4 and out/hadal-ad-portrait.mp4
```

The finished films are in `ads/`: `hadal-ad-landscape.mp4` (1920×1080) and `hadal-ad-portrait.mp4` (1080×1920), both with sound. A smaller 720p copy in `site/assets/` plays in the website's "Film" section.

> HADAL, Lumen‑6, the dives and the guest quotes are all made up for this demo.
