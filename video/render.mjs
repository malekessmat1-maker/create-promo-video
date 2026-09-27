// Renders every film in both formats: node render.mjs [filter]
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import fs from 'node:fs';
import path from 'node:path';

const data = JSON.parse(fs.readFileSync('src/films.json', 'utf8'));
const filter = process.argv[2] ?? '';
const ids = Object.keys(data.films).flatMap((f) => [`${f}-16x9`, `${f}-9x16`]).filter((id) => id.includes(filter));
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
fs.mkdirSync('out', {recursive: true});
for (const id of ids) {
  const composition = await selectComposition({serveUrl, id});
  const outputLocation = `out/VeylonAuto-${id}.mp4`;
  let last = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: 'h264',
    crf: 18,
    pixelFormat: 'yuv420p',
    audioCodec: 'aac',
    audioBitrate: '320k',
    outputLocation,
    onProgress: ({progress}) => {
      const p = Math.floor(progress * 10);
      if (p !== last) {
        last = p;
        process.stdout.write(`${id} ${p * 10}%\n`);
      }
    },
  });
  console.log('rendered', outputLocation);
}
