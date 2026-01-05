
export enum AppStep {
  Setup = 'SETUP',
  Design = 'DESIGN',
  Animate = 'ANIMATE',
  View = 'VIEW'
}

export interface LogoData {
  url: string;
  base64: string;
  mimeType: string;
  prompt: string;
}

export interface AnimationData {
  videoUrl: string;
  prompt: string;
}

export type ImageSize = '1K' | '2K' | '4K';
export type AspectRatio = '1:1' | '16:9' | '9:16';
