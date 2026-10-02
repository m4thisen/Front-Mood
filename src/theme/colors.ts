/**
 * Mood — sistema de color v3
 *
 * Fondo: azul marino profundo (se mantiene — es la identidad de la app).
 * Lo que cambia acá: las superficies neutras (cards, bordes, texto
 * secundario) bajan su tinte azul para que no compita con el fondo — el
 * color de verdad lo ponen los moods, inspirados en "Intensamente"
 * (Ira · Miedo · Asco · Tristeza · Alegría), bien saturados y brillosos.
 */

export const colors = {
  // Fondo — azul marino profundo
  background: '#050B1E',
  backgroundAlt: '#0B1633',

  // Superficies — neutras, con apenas un dejo frío (ya no "todo azul")
  surface: '#161A28',
  surfaceElevated: '#1E2333',
  surfaceElevatedAlt: '#282E42',

  // Bordes / separadores — grises neutros, no celestes
  border: 'rgba(210, 214, 230, 0.08)',
  borderStrong: 'rgba(210, 214, 230, 0.16)',

  // Texto
  textPrimary: '#F6F8FF',
  textSecondary: '#A3A8C0',
  textTertiary: '#6B7090',

  // Acento — el azul queda reservado a interacción (botones, selección)
  accent: '#5B8CFF',
  accentSoft: 'rgba(91, 140, 255, 0.18)',
  accentStrong: '#82ACFF',

  gold: '#FFD400',
  goldSoft: 'rgba(255, 212, 0, 0.18)',

  success: '#5FD37A',
  danger: '#FF4D5E',

  overlay: 'rgba(3, 6, 16, 0.78)',
} as const;

/**
 * Escala de mood (1 a 5) — paleta "Intensamente": cada nivel toma el color
 * de un personaje de la película. Son los colores más vívidos de toda la
 * app a propósito — el fondo neutro existe para que estos brillen.
 */
export const moodScale = [
  { level: 1, name: 'ira', color: '#FF4757', glow: 'rgba(255, 71, 87, 0.5)' },
  { level: 2, name: 'miedo', color: '#A55EEA', glow: 'rgba(165, 94, 234, 0.5)' },
  { level: 3, name: 'asco', color: '#26DE81', glow: 'rgba(38, 222, 129, 0.5)' },
  { level: 4, name: 'tristeza', color: '#45AAF2', glow: 'rgba(69, 170, 242, 0.5)' },
  { level: 5, name: 'alegria', color: '#FFD32A', glow: 'rgba(255, 211, 42, 0.55)' },
] as const;

export const emptyDayColor = 'rgba(210, 214, 230, 0.06)';

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export const getMoodColor = (level: MoodLevel | undefined): string => {
  if (!level) return emptyDayColor;
  return moodScale[level - 1].color;
};

export const getMoodGlow = (level: MoodLevel | undefined): string => {
  if (!level) return 'transparent';
  return moodScale[level - 1].glow;
};
