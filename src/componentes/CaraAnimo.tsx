import React, { useId } from 'react';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { NivelAnimo } from '@/dominio';
import { getMoodColor } from '@/tema/colors';
import { shade } from '@/utils/color';

interface Props {
  nivel: NivelAnimo;
  tamano?: number;
}

const TRAZO = 'rgba(5, 11, 30, 0.78)';

/** Boca de cada nivel, en un lienzo de 100×100. */
const BOCAS: Record<NivelAnimo, string> = {
  1: 'M32 72 Q50 56 68 72',
  2: 'M35 68 Q50 61 65 68',
  3: 'M36 66 L64 66',
  4: 'M33 61 Q50 75 67 61',
  5: 'M30 57 Q50 86 70 57 Z',
};

/**
 * Carita de ánimo dibujada a mano (Muy mal → Genial). Cada nivel es una
 * "estrella" del color de su emoción, con un brillo suave arriba a la
 * izquierda, como el resto del lenguaje visual de la app.
 */
export const CaraAnimo: React.FC<Props> = ({ nivel, tamano = 52 }) => {
  const id = useId().replace(/:/g, '');
  const color = getMoodColor(nivel);

  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 100 100">
      <Defs>
        <RadialGradient id={`brillo-${id}`} cx="36%" cy="30%" r="78%">
          <Stop offset="0" stopColor={shade(color, 0.42)} />
          <Stop offset="0.55" stopColor={color} />
          <Stop offset="1" stopColor={shade(color, -0.2)} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill={`url(#brillo-${id})`} />

      {nivel === 1 && (
        <>
          <Path d="M27 33 L42 39" stroke={TRAZO} strokeWidth={5} strokeLinecap="round" />
          <Path d="M73 33 L58 39" stroke={TRAZO} strokeWidth={5} strokeLinecap="round" />
        </>
      )}
      {nivel === 5 ? (
        <>
          <Path d="M28 45 Q35 36 42 45" stroke={TRAZO} strokeWidth={5} strokeLinecap="round" fill="none" />
          <Path d="M58 45 Q65 36 72 45" stroke={TRAZO} strokeWidth={5} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <Circle cx="36" cy="46" r="5.5" fill={TRAZO} />
          <Circle cx="64" cy="46" r="5.5" fill={TRAZO} />
        </>
      )}

      <Path
        d={BOCAS[nivel]}
        stroke={TRAZO}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={nivel === 5 ? TRAZO : 'none'}
      />
    </Svg>
  );
};
