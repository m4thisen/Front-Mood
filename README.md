# Mood — aplicación móvil

Diario emocional offline-first. Trabajo Final de Grado — Ingeniería en
Informática, Universidad del CEMA. Autor: Matías Nahuel Casullo. Tutor:
Ing. Gastón Addati.

Este repositorio contiene **la aplicación móvil** (React Native + Expo +
TypeScript). El servidor (Node.js + Express + PostgreSQL) vive en un
repositorio aparte.

## Arquitectura

La app sigue el diagrama de clases de la aplicación móvil: cada capa depende
solo de la de abajo.

```
src/
  pantallas/      «frontera»    lo que ve el usuario (Bienvenida, Inicio, Registro, …)
  stores/         «control»     estado y coordinación (SesionStore, RegistroStore) — Zustand
  servicios/      «servicio»    lógica: MotorEstadistico, CalculadoraProgreso, ExportService, …
  persistencia/   «persistencia» base local del dispositivo (fuente de verdad)
  api/            comunicación con el servidor (ApiClient); IA y música todavía simuladas
  dominio/        entidades y reglas de negocio (RegistroDiario, Usuario, …)
  componentes/    piezas visuales reutilizables
  navegacion/  datos/  tema/  i18n/  utils/
```

- El motor estadístico, la racha y el Color del Alma corren **en el
  dispositivo**, sin conexión.
- Las claves de servicios externos (Google, Claude, Spotify) **nunca** van
  en la app: solo el servidor habla con esos servicios.
- La sesión se abre contra el servidor, pero la app no lo necesita para
  arrancar: abre con lo guardado en el dispositivo. Los tokens viven en el
  llavero del sistema (`AlmacenSeguro`), nunca en AsyncStorage.
- El perfil, las preferencias y los tags se guardan primero en el
  dispositivo y después se mandan al servidor. Sin conexión quedan
  pendientes y se reintentan al abrir la app, al volver a ella y antes de
  cerrar sesión (`PreferenciasPendientes`).
- Todos los textos están en español e inglés (`src/i18n`).

## Diseño

- **Tokens** en `src/tema/` (colores, tipografía, espaciado, radios). La
  escala de cinco colores del ánimo es la identidad de la app y siempre va
  acompañada de una etiqueta o de la cara, nunca sola.
- **Íconos**: SF Symbols en iOS y Material Symbols en Android, vía
  `expo-symbols`. Todos pasan por `componentes/Icono.tsx`, que los nombra
  por su significado (`calendario`, `racha`, `bloqueEstudios`, …).
- **Piezas base**: `Boton`, `Chip`, `Lista` (filas al estilo Ajustes),
  `HojaInferior` (hoja que sube desde abajo), `PasoOnboarding` (esqueleto
  de cada paso) y `Encabezados`.
- Respuesta háptica en las acciones importantes (`utils/hapticos`).
- En desarrollo, la Bienvenida ofrece una **cuenta demo** con 60 días de
  datos para ver todas las pantallas cargadas.

## Requisitos

- Node.js LTS y npm
- macOS con Xcode y [CocoaPods](https://cocoapods.org) (`brew install cocoapods`)
- Un iPhone o el simulador de iOS

El inicio de sesión con Google necesita código nativo, así que la app se
prueba con un **development build**, no con Expo Go.

## Cómo correrla

```bash
npm install
npx expo run:ios
```

La primera vez compila la app nativa (tarda varios minutos). Las siguientes
veces alcanza con `npx expo start` y abrir la app ya instalada.

Para entrar hace falta el servidor ([mood-app-back](https://github.com/m4thisen/mood-app-back))
corriendo con `npm run dev`. En el simulador la app lo busca en
`http://localhost:3000`; para otra dirección, copiá `.env.example` a `.env` y
cambiá `EXPO_PUBLIC_API_URL`.

Se entra con Google. Mientras el proyecto de Google Cloud esté en modo de
prueba, solo pueden entrar las cuentas agregadas como usuarios de prueba en
la consola (Google Auth Platform → Público). En desarrollo también hay una
**cuenta de prueba**: la app pide un email cualquiera y el mismo email entra
siempre a la misma cuenta, para probar con varias cuentas (el servidor tiene
que estar con `CUENTAS_DE_PRUEBA=true`).

Si cambiás dependencias nativas o `app.json`, regenerá el proyecto de iOS (si
`pod install` falla con un error de codificación, antes corré
`export LANG=en_US.UTF-8`):

```bash
npx expo prebuild --platform ios --clean
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | Verifica los tipos de TypeScript (modo estricto) |
| `npm test` | Corre las pruebas unitarias (Jest) |
| `npm run ios` | Compila e instala la app en iOS |

## Estado

Construcción organizada en siete iteraciones (ver la tesis, Fase 3).

- [x] **Iteración 0 — Base del proyecto**: Expo SDK 57, estructura por capas,
  entidades, stores, navegación, i18n, Jest y rediseño visual de todas las
  pantallas.
- [ ] Iteración 1 — Acceso y configuración (login con Google, sesiones)
- [ ] Iteración 2 — Registro diario (SQLite, recordatorio)
- [ ] Iteración 3 — Sincronización
- [ ] Iteración 4 — Visualización y análisis
- [ ] Iteración 5 — Música e IA
- [ ] Iteración 6 — Portabilidad y terminación

La IA y la música todavía se simulan dentro de la app. Los datos se guardan provisoriamente en AsyncStorage y
pasan a SQLite en la iteración 2.
