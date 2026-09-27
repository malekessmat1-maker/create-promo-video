import {continueRender, delayRender, staticFile, useVideoConfig} from 'remotion';

// Brand tokens copied from veylonauto.vercel.app (:root custom properties).
export const C = {
  ink: '#070707',
  panel: '#101010',
  soft: '#171717',
  line: '#2a2a2a',
  paper: '#f5f3ee',
  muted: '#a9a9a5',
  orange: '#ff5a1f',
  orange2: '#ff8a00',
};

// Oswald + Inter (the site's typefaces), bundled locally as variable fonts (SIL OFL).
const loadLocalFont = (family: string, file: string, weight: string) => {
  if (typeof document === 'undefined') return;
  const handle = delayRender(`font ${family}`);
  const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, {weight});
  face
    .load()
    .then(() => {
      (document.fonts as unknown as {add: (f: FontFace) => void}).add(face);
      continueRender(handle);
    })
    .catch((err) => {
      console.error(err);
      throw err;
    });
};

loadLocalFont('Oswald', 'Oswald-var-latin.woff2', '200 700');
loadLocalFont('Inter', 'Inter-var-latin.woff2', '100 900');

export const F = {
  display: 'Oswald, sans-serif',
  body: 'Inter, sans-serif',
};

export const FPS = 30;

// Contact details supplied by Veylon Auto.
export const CONTACT = {
  url: 'veylonauto.vercel.app',
  phone: '+20 104 375 4416',
};

/**
 * Designs are authored in "design pixels": 1920 wide for landscape,
 * 1080 wide for portrait. `u` converts them to real pixels.
 */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const u = portrait ? width / 1080 : width / 1920;
  return {portrait, width, height, u};
};
