// Renders review stills: one frame per scene (plus key moments) for chosen compositions.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const data = JSON.parse(fs.readFileSync('src/films.json', 'utf8'));
const [, , outDir = 'out/stills', filter = ''] = process.argv;
const ids = [];
for (const f of Object.keys(data.films)) for (const fmt of ['16x9', '9x16']) ids.push(`${f}-${fmt}`);
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync(outDir, {recursive: true});
for (const id of ids.filter((i) => i.includes(filter))) {
  const composition = await selectComposition({serveUrl, id});
  const film = data.films[id.split('-')[0]];
  let t = 0;
  for (const [i, s] of film.scenes.entries()) {
    const frames = [t + Math.floor(s.dur * 0.75)];
    for (const fr of frames) {
      const out = `${outDir}/${id}_${String(i + 1).padStart(2, '0')}_${s.type}_${fr}.jpg`;
      await renderStill({composition, serveUrl, output: out, frame: fr, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5});
    }
    t += s.dur;
  }
  console.log('done', id);
}
