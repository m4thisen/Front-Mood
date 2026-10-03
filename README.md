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
  api/            comunicación con el servidor (por ahora, respuestas simuladas)
  dominio/        entidades y reglas de negocio (RegistroDiario, Usuario, …)
  componentes/    piezas visuales reutilizables
  navegacion/  datos/  tema/  i18n/  utils/
```

- El motor estadístico, la racha y el Color del Alma corren **en el
  dispositivo**, sin conexión.
- Las claves de servicios externos (Google, Claude, Spotify) **nunca** van
  en la app: solo el servidor habla con esos servicios.
- Todos los textos están en español e inglés (`src/i18n`).

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

Si cambiás dependencias nativas o `app.json`, regenerá el proyecto de iOS:

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
  entidades, stores, navegación, i18n, Jest.
- [ ] Iteración 1 — Acceso y configuración (login con Google, sesiones)
- [ ] Iteración 2 — Registro diario (SQLite, recordatorio)
- [ ] Iteración 3 — Sincronización
- [ ] Iteración 4 — Visualización y análisis
- [ ] Iteración 5 — Música e IA
- [ ] Iteración 6 — Portabilidad y terminación

Mientras el servidor no exista, la identidad, la IA y la música se simulan
dentro de la app. Los datos se guardan provisoriamente en AsyncStorage y
pasan a SQLite en la iteración 2.
