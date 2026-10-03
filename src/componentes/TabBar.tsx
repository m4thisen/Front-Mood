import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, spacing, typography } from '@/tema';
import { useTranslation } from '@/i18n';

const ICONS: Record<string, string> = {
  Inicio: '🌙',
  Estadisticas: '✦',
  Cuenta: '◐',
  Registro: '＋',
};

const LABEL_KEYS: Record<string, string> = {
  Inicio: 'tab.calendar',
  Estadisticas: 'tab.stats',
  Cuenta: 'tab.account',
  Registro: 'tab.today',
};

/**
 * Tab bar flotante. "Today" (subir tu día) va siempre última, a la derecha
 * de todo, marcada con una insignia glossy en degradé para que se note que
 * es la acción principal — pero dentro de la misma fila, sin superponerse.
 */
export const TabBar: React.FC<BottomTabBarProps> = ({ state, navigation }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const isToday = route.name === 'Registro';

          const onPress = () => {
            if (!focused) navigation.navigate(route.name);
          };

          if (isToday) {
            return (
              <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
                <LinearGradient
                  colors={[colors.accent, colors.accentStrong]}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.9, y: 1 }}
                  style={[styles.todayBadge, shadow.glow(colors.accent)]}
                >
                  <Text style={styles.todayIcon}>{ICONS[route.name]}</Text>
                </LinearGradient>
                <Text style={[typography.micro, styles.label, focused && styles.labelActive]}>
                  {t(LABEL_KEYS[route.name])}
                </Text>
              </Pressable>
            );
          }

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tabButton}>
              <Text style={[styles.icon, focused && styles.iconActive]}>{ICONS[route.name]}</Text>
              <Text style={[typography.micro, styles.label, focused && styles.labelActive]}>
                {t(LABEL_KEYS[route.name])}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xl,
    ...shadow.soft,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  icon: {
    fontSize: 18,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  iconActive: {
    color: colors.accent,
  },
  label: {
    color: colors.textTertiary,
  },
  labelActive: {
    color: colors.textPrimary,
  },
  todayBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  todayIcon: {
    fontSize: 15,
    color: colors.background,
    fontWeight: '700',
  },
});
