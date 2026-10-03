import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { colors } from '@/tema';
import { shade } from '@/utils/color';

interface Props {
  color: string | null;
  size?: number;
}

interface Particle {
  x: number; // fracción -0.5..0.5 relativa al centro
  y: number;
  r: number; // radio del punto en px (a size=140)
  baseOpacity: number;
  lightness: number; // -0.3..0.55, cuánto se aclara/oscurece del color base
  phase: number; // desfasaje del titileo
  speed: number;
}

const PARTICLE_COUNT = 52;
const GOLDEN_ANGLE = 2.399963229728653; // ángulo dorado, en radianes

// Pseudo-random determinístico (mismo resultado siempre) para que la nube
// de partículas no cambie de forma en cada render.
const seeded = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const PARTICLES: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const t = (i + 0.5) / PARTICLE_COUNT;
  const radius = Math.pow(t, 0.65) * 0.5; // más denso al centro, se afina al borde
  const angle = i * GOLDEN_ANGLE + seeded(i) * 0.6;
  const jitterX = (seeded(i * 3.1) - 0.5) * 0.07;
  const jitterY = (seeded(i * 7.7) - 0.5) * 0.07;

  return {
    x: Math.cos(angle) * radius + jitterX,
    y: Math.sin(angle) * radius + jitterY,
    r: 1.4 + seeded(i * 5.3) * 2.6,
    baseOpacity: (0.35 + seeded(i * 2.2) * 0.5) * (1 - radius * 0.5),
    lightness: -0.25 + seeded(i * 9.1) * 0.75,
    phase: seeded(i * 4.4) * Math.PI * 2,
    speed: 0.7 + seeded(i * 6.6) * 0.9,
  };
});

const ParticleDot: React.FC<{
  particle: Particle;
  size: number;
  color: string;
  clock: SharedValue<number>;
}> = ({ particle, size, color, clock }) => {
  const dotColor = shade(color, particle.lightness);

  const animatedStyle = useAnimatedStyle(() => {
    const twinkle = 0.5 + 0.5 * Math.sin(clock.value * particle.speed + particle.phase);
    return {
      opacity: particle.baseOpacity * (0.55 + twinkle * 0.45),
      transform: [{ scale: 0.85 + twinkle * 0.3 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          width: particle.r * 2,
          height: particle.r * 2,
          borderRadius: particle.r,
          backgroundColor: dotColor,
          left: size / 2 + particle.x * size - particle.r,
          top: size / 2 + particle.y * size - particle.r,
        },
      ]}
    />
  );
};

/**
 * El "Color del Alma": una nube de partículas que titila y gira lentamente,
 * como el efecto de escaneo de iPhone — un enjambre de puntos de luz que
 * insinúa una esfera, no un objeto sólido. Se usa tanto en el logo de
 * bienvenida como en el "Color del Alma" del calendario.
 */
export const SoulOrb: React.FC<Props> = ({ color, size = 140 }) => {
  const clock = useSharedValue(0);
  const rotation = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    clock.value = withRepeat(withTiming(Math.PI * 2, { duration: 4000, easing: Easing.linear }), -1, false);
    rotation.value = withRepeat(withTiming(1, { duration: 22000, easing: Easing.linear }), -1, false);
    breathe.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const displayColor = color ?? colors.textTertiary;

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.16 + breathe.value * 0.14,
    transform: [{ scale: 1 + breathe.value * 0.12 }],
  }));

  const coreGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.28 + breathe.value * 0.22,
    transform: [{ scale: 0.92 + breathe.value * 0.1 }],
  }));

  // Memoizado: mismas partículas, solo cambia el color con el que se pintan.
  const dots = useMemo(
    () =>
      PARTICLES.map((particle, i) => (
        <ParticleDot key={i} particle={particle} size={size} color={displayColor} clock={clock} />
      )),
    [size, displayColor, clock]
  );

  return (
    <View style={[styles.wrapper, { width: size * 1.5, height: size * 1.5 }]}>
      {/* Halo difuso exterior */}
      <Animated.View
        style={[
          styles.glow,
          glowStyle,
          { width: size * 1.4, height: size * 1.4, borderRadius: size, backgroundColor: displayColor },
        ]}
      />
      {/* Resplandor central, más chico y más intenso */}
      <Animated.View
        style={[
          styles.glow,
          coreGlowStyle,
          { width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: displayColor },
        ]}
      />

      {/* La nube de partículas, girando lentamente */}
      <Animated.View style={[rotateStyle, { width: size, height: size }]}>{dots}</Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  particle: {
    position: 'absolute',
  },
});
