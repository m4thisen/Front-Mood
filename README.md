# Mood — diario emocional (boceto v1)

Base de la app en React Native (Expo + TypeScript), armada según lo conversado:
onboarding completo (bienvenida → registro → bloques → bloques especiales →
hora de notificación) y la app principal con 4 tabs (Calendario/heatmap,
Estadísticas, Hoy, Mi cuenta) + el detalle de día como modal.

**No incluye todavía:** backend, análisis por IA, ni integración real con la
API de Spotify (el campo "canción del día" es texto libre por ahora). Todo se
guarda localmente en el dispositivo con AsyncStorage.

## ⚠️ Importante: no pude correrlo yo mismo

El entorno donde armé este proyecto no tiene acceso a internet, así que no
pude ejecutar `npm install` ni levantar el servidor de Expo para mostrarte
una preview funcionando. Repasé el código a mano buscando bugs obvios
(imports rotos, lógica de fechas, etc.), pero **no está probado en un
dispositivo real todavía** — es esperable que aparezcan uno o dos errores
menores la primera vez que lo corras. Pegame el error si pasa y lo arreglamos
al toque.

## Cómo correrlo

Necesitás [Node.js](https://nodejs.org) (18+) y la app **Expo Go** instalada
en tu celular (disponible en App Store / Play Store).

```bash
cd mood-app
npm install
npx expo start
```

Si al arrancar Expo te avisa que alguna librería nativa (reanimated,
gesture-handler, screens, safe-area-context, etc.) tiene una versión que no
coincide exactamente con tu SDK de Expo instalado, corré:

```bash
npx expo install --fix
```

Eso ajusta automáticamente las versiones a las que corresponden. Puse
versiones típicas de Expo SDK 51 a mano (sin poder verificarlas contra el
registry desde acá), así que es el paso más probable que necesites.

Esto te va a mostrar un código QR en la terminal:

- **Android:** abrí la app Expo Go y escaneá el QR.
- **iOS:** escaneá el QR con la cámara del iPhone (te va a ofrecer abrirlo en Expo Go).

También podés apretar `w` en la terminal para abrirlo en el navegador,
aunque como es una app pensada 100% para mobile, algunas cosas (notificaciones,
compartir archivos) no van a funcionar ahí.

## Estructura del proyecto

```
src/
  theme/        → colores, tipografía, espaciado (design tokens)
  types/        → tipos de datos (UserProfile, DayEntry, etc.)
  data/         → categorías de bloques y sus opciones
  i18n/         → textos en español/inglés
  storage/      → persistencia con AsyncStorage
  context/      → estado global de la app (AppContext)
  navigation/   → stack raíz + tabs
  components/   → piezas reutilizables (botones, cards, el heatmap, etc.)
  screens/
    onboarding/ → Welcome, Register, BlocksSelection, SpecialBlocks, NotificationTime
    main/       → Calendar, Stats, TodayEntry, Account
    DayDetailScreen.tsx (modal)
```

## Dirección de diseño

Concepto: **"tu cielo nocturno emocional"**. Fondo azul-noche profundo
(nunca negro puro), los moods funcionan como estrellas de distintos colores,
y el "Color del Alma" es un orbe que respira lentamente combinando todos
los colores registrados — es el elemento distintivo de la app. Tipografía:
Fraunces (serif cálida, para títulos) + Manrope (para todo lo demás).

## Qué falta / próximos pasos sugeridos

- Conectar un backend real (guardar usuarios y entradas en la nube)
- Reemplazar el campo de texto libre de "canción del día" por una búsqueda
  real contra la API de Spotify
- Resumen semanal y notas del día generadas por IA (llamando a un modelo
  de lenguaje con el resumen de la semana como contexto)
- Autenticación real con Google (hoy el botón solo marca `isLoggedIn: true`)
- Reemplazar los selectores de hora "chips horizontales" por un time picker nativo
