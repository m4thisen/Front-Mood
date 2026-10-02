/**
 * Dos roles tipográficos, usados con disciplina:
 *
 * - Display (Fraunces): serif cálida y un poco "wonky" — el lado Disney/
 *   emocional. Se usa SOLO en títulos grandes, saludos y el nombre "Mood".
 * - UI / cuerpo (Manrope): geométrica, neutra, precisa — el lado Vercel/
 *   Apple. Se usa para todo el resto: labels, botones, stats, texto libre.
 */

export const fontFamily = {
  displayRegular: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displaySemiBold: 'Fraunces_600SemiBold_Italic',
  displayItalic: 'Fraunces_400Regular_Italic',

  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemiBold: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyExtraBold: 'Manrope_800ExtraBold',
} as const;

export const typography = {
  displayXL: { fontFamily: fontFamily.displayMedium, fontSize: 40, lineHeight: 46 },
  displayL: { fontFamily: fontFamily.displayMedium, fontSize: 32, lineHeight: 38 },
  displayM: { fontFamily: fontFamily.displayMedium, fontSize: 26, lineHeight: 32 },

  title: { fontFamily: fontFamily.bodyBold, fontSize: 20, lineHeight: 26 },
  subtitle: { fontFamily: fontFamily.bodySemiBold, fontSize: 16, lineHeight: 22 },

  body: { fontFamily: fontFamily.body, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.bodyMedium, fontSize: 15, lineHeight: 22 },

  caption: { fontFamily: fontFamily.bodyMedium, fontSize: 13, lineHeight: 18 },
  micro: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },

  statNumber: { fontFamily: fontFamily.bodyExtraBold, fontSize: 30, lineHeight: 34 },
} as const;
