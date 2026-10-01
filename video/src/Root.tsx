import React from 'react';
import { Composition } from 'remotion';
import { defaultPromoProps, Promo, promoSchema } from './Promo';
import { F, FPS } from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="PromoLandscape" component={Promo} schema={promoSchema} defaultProps={defaultPromoProps} durationInFrames={F.end} fps={FPS} width={1920} height={1080} />
    <Composition id="PromoPortrait" component={Promo} schema={promoSchema} defaultProps={defaultPromoProps} durationInFrames={F.end} fps={FPS} width={1080} height={1920} />
  </>
);
