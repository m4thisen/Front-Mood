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
  persistencia/   «persistencia» base local SQLite del dispositivo (fuente de verdad)
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
- Los registros, el perfil, las preferencias y los tags viven en una base
  **SQLite** local (`persistencia/baseLocal.ts`). Su esquema se versiona con
  migraciones y repite las reglas del dominio con restricciones (un registro
  por fecha, ánimo de 1 a 5, rangos de sueño y ejercicio). Todo esto
  funciona sin conexión: la app cumple su función principal sin el servidor.
- Los registros se **sincronizan** con el servidor en segundo plano
  (`SyncService`, CU-12): al guardar el día, al abrir la app, al volver a
  ella, cada 10 minutos y al recuperar la conexión. Sin señal quedan
  pendientes y se reintenta con espera creciente; nunca se pierde ni se
  duplica nada. Si el mismo día se editó en dos teléfonos, gana la última
  edición. En un teléfono nuevo, el historial baja solo al entrar.
- El recordatorio diario es una notificación **local**: se programan los
  avisos de los próximos 14 días a la hora elegida, salteando los días ya
  registrados. Tocar el aviso abre el formulario del día.
- El perfil, las preferencias y los tags se guardan primero en el
  dispositivo y después se mandan al servidor. Sin conexión quedan
  pendientes y se reintentan al abrir la app, al volver a ella y antes de
  cerrar sesión (`PreferenciasPendientes`).
- El texto libre de cada día solo lo lee la IA del servidor si la persona
  da el permiso: un interruptor en Mi cuenta ("Que la IA lea mis textos"),
  apagado por defecto. La primera vez que escribe un texto, el formulario
  del día se lo pregunta una sola vez, sin interrumpir. El permiso viaja
  aparte del resto del perfil, así un teléfono desactualizado nunca apaga
  uno que se dio en otro; apagarlo hace que el servidor borre lo que ya
  leyó la IA. Lo que entiende la IA (nunca el texto) también entra al
  reentrenamiento semanal del modelo, y la explicación del permiso lo dice.
- Los textos de la iteración 0 están en español e inglés (`src/i18n`); los
  nuevos se escriben directamente en español.

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

## Dependencias y auditoría

La app se construye y se prueba para iPhone.

`npm audit` todavía marca dos avisos altos y uno moderado, todos en
herramientas de compilación y de pruebas que no tienen versión corregida
publicada:

| Paquete | Aviso | Lo trae |
|---|---|---|
| `braces` 3.0.3 (alto) | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Jest y la CLI de Expo, para resolver patrones de archivos |
| `node-forge` 1.4.0 (alto) | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | La CLI de Expo, para firmar actualizaciones (no se usa) |
| `sprintf-js` 1.1.3 (moderado) | [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Jest (cobertura) |

Ninguno viaja dentro de la app: el bundle de producción
(`npx expo export --platform ios --source-maps`) no incluye ningún módulo de
esos paquetes. Además, los tres fallan solo con datos de un atacante (patrones,
firmas o formatos armados a propósito), y estas herramientas solo procesan
archivos del propio proyecto. Hay que volver a correr `npm audit` antes de la
entrega por si aparece la versión corregida.

`uuid` sí tenía arreglo: se fuerza la 11.1.1 con `overrides` en
`package.json`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | Verifica los tipos de TypeScript (modo estricto) |
| `npm test` | Corre las pruebas (Jest). Las de la base local usan SQLite real (sql.js) |
| `npm run ios` | Compila e instala la app en iOS |

## Estado

Construcción organizada en siete iteraciones (ver la tesis, Fase 3).

- [x] **Iteración 0 — Base del proyecto**: Expo SDK 57, estructura por capas,
  entidades, stores, navegación, i18n, Jest y rediseño visual de todas las
  pantallas.
- [x] **Iteración 1 — Acceso y configuración**: entrar con Google, sesión
  segura que se mantiene entre usos y se renueva sola, onboarding, Mi cuenta
  y tags guardados en el servidor (también si se cambian sin conexión).
  Pendiente: la prueba en un iPhone físico.
- [x] **Iteración 2 — Registro diario**: base local SQLite, formulario del
  día con sus validaciones y la regla de medianoche, edición solo del día en
  curso y recordatorio local que no molesta si ya registraste.
  Pendiente: la prueba en un iPhone físico.
- [x] **Iteración 3 — Sincronización**: registros respaldados en el
  servidor, historial completo en un teléfono nuevo, pendientes que se
  mandan antes de cerrar sesión y reintentos ante cortes.
  Pendiente: la prueba en un iPhone físico.
- [ ] **Iteración 4 — Núcleo de IA** (en curso, la mayor parte en el
  servidor): permiso para que la IA lea el texto, en Mi cuenta y en el
  formulario del día.
- [ ] Iteración 5 — Música e IA
- [ ] Iteración 6 — Portabilidad y terminación

La IA y la música todavía se simulan dentro de la app.
