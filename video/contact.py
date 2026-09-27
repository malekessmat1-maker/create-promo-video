# Tiles review stills into a contact sheet: python3 contact.py <glob> <out>
import sys, glob
from PIL import Image, ImageDraw
fs = sorted(glob.glob(sys.argv[1]), key=lambda f: int(f.rsplit('_', 1)[1].split('.')[0]))
ims = [Image.open(f) for f in fs]
w, h = ims[0].size
cols = 3 if w > h else 6
tw = 640 if w > h else 320
th = int(h * tw / w)
sheet = Image.new('RGB', (cols * tw, ((len(ims) + cols - 1) // cols) * (th + 22)), 'white')
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    sheet.paste(im.resize((tw, th)), (x, y))
    d.text((x + 4, y + th + 4), f.split('/')[-1], fill='black')
sheet.save(sys.argv[2], quality=85)
