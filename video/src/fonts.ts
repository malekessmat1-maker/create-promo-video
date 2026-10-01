import { continueRender, delayRender, staticFile } from 'remotion';

// Fonts ship in public/fonts so renders never depend on a font CDN.
const FACES: [string, string, string, string][] = [
  ['Big Shoulders', 'BigShoulders-900.woff2', '900', 'normal'],
  ['Big Shoulders', 'BigShoulders-700.woff2', '700 800', 'normal'],
  ['Instrument Serif', 'InstrumentSerif-Italic.woff2', '400', 'italic'],
  ['Hanken', 'Hanken-500.woff2', '400 600', 'normal'],
  ['Plex Mono', 'PlexMono-500.woff2', '400 500', 'normal'],
  ['Bricolage', 'Bricolage-800.woff2', '700 800', 'normal'],
  ['Figtree', 'Figtree-600.woff2', '400 700', 'normal'],
  ['JetBrains', 'JetBrainsMono-600.woff2', '400 700', 'normal'],
];

if (typeof document !== 'undefined') {
  const handle = delayRender('Loading fonts');
  Promise.all(
    FACES.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format('woff2')`, { weight, style });
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(handle))
    .catch((err) => { console.error(err); continueRender(handle); });
}
