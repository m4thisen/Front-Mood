/**
 * Dos roles tipográficos, usados con disciplina:
 *
 * - Display (Fraunces): serif cálida — el lado Disney/emocional. Se usa SOLO
 *   en títulos de pantalla, el saludo y el nombre "Mood".
 * - UI (Manrope): geométrica y neutra — el lado Vercel/Apple. Todo el resto.
 *
 * La escala sigue los tamaños de iOS (large title, headline, body, footnote)
 * para que la app se sienta nativa.
 */
import { TextStyle } from 'react-native';

export const fontFamily = {
  displayRegular: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displayItalic: 'Fraunces_400Regular_Italic',

  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;

/** Números de ancho fijo: las cifras no "bailan" cuando cambian. */
const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const typography = {
  displayXL: { fontFamily: fontFamily.displayMedium, fontSize: 40, lineHeight: 46, letterSpacing: -0.5 },
  displayL: { fontFamily: fontFamily.displayMedium, fontSize: 32, lineHeight: 38, letterSpacing: -0.4 },
  displayM: { fontFamily: fontFamily.displayMedium, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },

  /** Título grande de cada pantalla. */
  largeTitle: { fontFamily: fontFamily.displayMedium, fontSize: 34, lineHeight: 40, letterSpacing: -0.5 },

  title: { fontFamily: fontFamily.bodyBold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  headline: { fontFamily: fontFamily.bodySemiBold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  subtitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 22 },

  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 15, lineHeight: 22 },

  caption: { fontFamily: fontFamily.bodyMedium, fontSize: 13, lineHeight: 18 },
  footnote: { fontFamily: fontFamily.bodyMedium, fontSize: 13, lineHeight: 18 },
  /** Encabezado de sección, en mayúsculas espaciadas. */
  seccion: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  } as TextStyle,
  micro: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },

  statNumber: { fontFamily: fontFamily.bodyExtraBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.6, ...tabular },
  numero: { fontFamily: fontFamily.bodyBold, fontSize: 17, lineHeight: 22, ...tabular },
} as const;
