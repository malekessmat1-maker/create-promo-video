import React from 'react';
import {Composition, Folder} from 'remotion';
import data from './films.json';
import {Film, filmDuration, FilmName} from './Film';
import {FPS} from './theme';

const films = Object.keys(data.films) as FilmName[];

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Landscape-16x9">
      {films.map((f) => (
        <Composition key={f} id={`${f}-16x9`} component={Film} durationInFrames={filmDuration(f)} fps={FPS} width={1920} height={1080} defaultProps={{film: f}} />
      ))}
    </Folder>
    <Folder name="Portrait-9x16">
      {films.map((f) => (
        <Composition key={f} id={`${f}-9x16`} component={Film} durationInFrames={filmDuration(f)} fps={FPS} width={1080} height={1920} defaultProps={{film: f}} />
      ))}
    </Folder>
  </>
);
