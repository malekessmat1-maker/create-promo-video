import React from 'react';
import {AbsoluteFill, Audio, Series, staticFile} from 'remotion';
import data from './films.json';
import {C} from './theme';
import {PhotoSpec} from './components/ui';
import {BigNumber, ColdOpen, LogoReveal, PhotoStatement, Scratch} from './scenes/TextScenes';
import {BeforeAfter, CityRoll, FilterDemo, SearchDemo, Services, Stats, Steps} from './scenes/InfoScenes';
import {CTA} from './scenes/CTA';

export type FilmName = keyof typeof data.films;
type Scene = {type: string; dur: number; energy: number; props: Record<string, unknown>};

const photos = data.photos as Record<string, PhotoSpec>;
const blocks = data.blocks as Record<string, Record<string, unknown>>;

/** Expand block references and photo keys into concrete scene props. */
const resolve = (props: Record<string, unknown>) => {
  const {block, ...rest} = props as {block?: string} & Record<string, unknown>;
  const merged: Record<string, unknown> = {...(block ? blocks[block] : {}), ...rest};
  if (typeof merged.photo === 'string') merged.photo = photos[merged.photo];
  if (Array.isArray(merged.items)) {
    merged.items = (merged.items as Record<string, unknown>[]).map((it) =>
      typeof it.photo === 'string' ? {...it, photo: photos[it.photo]} : it,
    );
  }
  return merged;
};

const components: Record<string, React.FC<any>> = {
  cold: ColdOpen,
  photo: PhotoStatement,
  scratch: Scratch,
  logo: LogoReveal,
  bignumber: BigNumber,
  stats: Stats,
  filter: FilterDemo,
  steps: Steps,
  pillars: Steps,
  services: Services,
  cities: CityRoll,
  beforeafter: BeforeAfter,
  search: SearchDemo,
  cta: CTA,
};

export const filmDuration = (name: FilmName) => (data.films[name].scenes as Scene[]).reduce((a, s) => a + s.dur, 0);

export const Film: React.FC<{film: FilmName}> = ({film}) => {
  const scenes = data.films[film].scenes as Scene[];
  return (
    <AbsoluteFill style={{backgroundColor: C.ink}}>
      <Series>
        {scenes.map((s, i) => {
          const Comp = components[s.type];
          if (!Comp) throw new Error(`Unknown scene type ${s.type}`);
          return (
            <Series.Sequence key={i} durationInFrames={s.dur} name={`${String(i + 1).padStart(2, '0')} ${s.type}`}>
              <Comp {...resolve(s.props)} dur={s.dur} />
            </Series.Sequence>
          );
        })}
      </Series>
      <Audio src={staticFile(`audio/${film.toLowerCase()}.wav`)} />
    </AbsoluteFill>
  );
};
