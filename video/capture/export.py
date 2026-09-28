"""Converts capture/shots/*.png into the film assets in public/site/."""
from pathlib import Path

from PIL import Image

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'capture' / 'shots'
OUT = ROOT / 'public' / 'site'
OUT.mkdir(parents=True, exist_ok=True)

SINGLE = ['hero', 'studios', 'studios-madrid', 'studios-madrid-ppf', 'studios-card', 'profile', 'films', 'growth-hero']
for n in SINGLE:
    Image.open(SHOTS / 'desktop' / f'{n}.png').convert('RGB').save(OUT / f'd-{n}.jpg', quality=90)
    Image.open(SHOTS / 'mobile' / f'{n}.png').convert('RGB').save(OUT / f'm-{n}.jpg', quality=90)

# Full pages. Heights in CSS px must match SCROLL in src/scenes/SiteScenes.tsx.
f = Image.open(SHOTS / 'desktop' / 'market-full.png').convert('RGB')
f.crop((0, 0, 2880, 5200 * 2)).resize((1800, 6500), Image.LANCZOS).save(OUT / 'd-market-full.jpg', quality=88)
g = Image.open(SHOTS / 'desktop' / 'growth-full.png').convert('RGB')
g.resize((1800, round(g.height * 1800 / 2880)), Image.LANCZOS).save(OUT / 'd-growth-full.jpg', quality=88)
f = Image.open(SHOTS / 'mobile' / 'market-full.png').convert('RGB')
f.crop((0, 0, 1170, 3600 * 3)).resize((900, 8308), Image.LANCZOS).save(OUT / 'm-market-full.jpg', quality=88)
g = Image.open(SHOTS / 'mobile' / 'growth-full.png').convert('RGB')
g.resize((900, round(g.height * 900 / 1170)), Image.LANCZOS).save(OUT / 'm-growth-full.jpg', quality=88)
print('exported to', OUT)
