export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const hexToRgb = (hex: string): RGB => {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

export const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/** Promedia una lista de colores hex (con repetición) en un único color hex. */
export const averageColors = (hexColors: string[]): string | null => {
  if (hexColors.length === 0) return null;
  const totals = hexColors.reduce(
    (acc, hex) => {
      const { r, g, b } = hexToRgb(hex);
      return { r: acc.r + r, g: acc.g + g, b: acc.b + b };
    },
    { r: 0, g: 0, b: 0 }
  );
  const n = hexColors.length;
  return rgbToHex({ r: totals.r / n, g: totals.g / n, b: totals.b / n });
};

/**
 * Aclara (percent > 0) u oscurece (percent < 0) un color hex. Se usa para
 * armar los degradés "glossy" (misma familia de color, más luz o más sombra).
 */
export const shade = (hex: string, percent: number): string => {
  const { r, g, b } = hexToRgb(hex);
  const amount = 255 * percent;
  const mix = (channel: number) =>
    amount >= 0 ? channel + (255 - channel) * percent : channel + channel * percent;
  return rgbToHex({ r: mix(r), g: mix(g), b: mix(b) });
};
