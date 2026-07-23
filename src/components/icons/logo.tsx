import * as React from 'react';

export const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path d="M50 10L10 90H25L35 60H65L75 90H90L50 10ZM42.5 50L50 27.5L57.5 50H42.5Z" fill="hsl(var(--primary))"/>
  </svg>
);
