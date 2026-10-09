import * as React from 'react';
import symbol from '@/assets/granzoti-symbol.png';
import wordmark from '@/assets/granzoti-wordmark.png';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1254 1254" role="img" aria-label="Granzoti Sistemas" xmlns="http://www.w3.org/2000/svg" {...props}>
    <image href={symbol.src} width="1254" height="1254" />
  </svg>
);

export const BrandLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="20 215 1410 805" role="img" aria-label="Granzoti Sistemas" xmlns="http://www.w3.org/2000/svg" {...props}>
    <image href={wordmark.src} width="1448" height="1086" />
  </svg>
);
