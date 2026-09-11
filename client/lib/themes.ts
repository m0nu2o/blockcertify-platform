
export type ThemeName =
  | 'light'
  | 'dark'
  | 'crystal-glass'
  | 'midnight-blue'
  | 'cyber-purple'
  | 'ocean-blue'
  | 'emerald-green'
  | 'sunset-orange'
  | 'rose-pink'
  | 'neon-cyberpunk'
  | 'aurora'
  | 'monochrome';

export const themes: Array<{ name: ThemeName; label: string; accent: string }> = [
  { name: 'light', label: 'Light', accent: '#60a5fa' },
  { name: 'dark', label: 'Dark', accent: '#94a3b8' },
  { name: 'crystal-glass', label: 'Crystal Glass', accent: '#38bdf8' },
  { name: 'midnight-blue', label: 'Midnight Blue', accent: '#3b82f6' },
  { name: 'cyber-purple', label: 'Cyber Purple', accent: '#8b5cf6' },
  { name: 'ocean-blue', label: 'Ocean Blue', accent: '#0ea5e9' },
  { name: 'emerald-green', label: 'Emerald Green', accent: '#10b981' },
  { name: 'sunset-orange', label: 'Sunset Orange', accent: '#f97316' },
  { name: 'rose-pink', label: 'Rose Pink', accent: '#ec4899' },
  { name: 'neon-cyberpunk', label: 'Neon Cyberpunk', accent: '#e879f9' },
  { name: 'aurora', label: 'Aurora', accent: '#22c55e' },
  { name: 'monochrome', label: 'Monochrome', accent: '#a1a1aa' },
];

export type FontName = 'inter' | 'space-grotesk' | 'outfit' | 'plus-jakarta-sans' | 'bricolage-grotesque' | 'syne' | 'playfair';

export const fonts: Array<{ name: FontName; label: string; variable: string }> = [
  { name: 'inter', label: 'Inter', variable: '--font-inter' },
  { name: 'space-grotesk', label: 'Space Grotesk', variable: '--font-space-grotesk' },
  { name: 'outfit', label: 'Outfit', variable: '--font-outfit' },
  { name: 'plus-jakarta-sans', label: 'Plus Jakarta', variable: '--font-plus-jakarta' },
  { name: 'bricolage-grotesque', label: 'Bricolage', variable: '--font-bricolage' },
  { name: 'syne', label: 'Syne', variable: '--font-syne' },
  { name: 'playfair', label: 'Playfair Display', variable: '--font-playfair' },
];
