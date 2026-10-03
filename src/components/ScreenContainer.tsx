import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '@/theme';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/**
 * Fondo compartido de toda la app: un degradé sutil de azul marino
 * (más claro arriba a la izquierda, más profundo abajo a la derecha)
 * en vez de un color plano — es lo que le da el aspecto "brilloso".
 */
const BackgroundGradient: React.FC = () => (
  <LinearGradient
    colors={[colors.backgroundAlt, colors.background, '#020510']}
    start={{ x: 0.15, y: 0 }}
    end={{ x: 0.9, y: 1 }}
    style={StyleSheet.absoluteFill}
  />
);

export const ScreenContainer: React.FC<Props> = ({ children, scroll = false, style, contentStyle }) => {
  if (scroll) {
    return (
      <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
        <BackgroundGradient />
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <BackgroundGradient />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
});
