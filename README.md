# Brass Birmingham — Edición Móvil (ES)

Versión móvil en español de **Brass: Birmingham** contra la **Mautoma**, con interfaz optimizada para teléfono y APK Android.

**App:** Brass Móvil ES  
**Autor:** [Nathanael De la Rosa](https://github.com/Lendherm)  
**Repositorio:** [Lendherm/brass-birmingham-mobile-es](https://github.com/Lendherm/brass-birmingham-mobile-es)  
**Basado en:** [KDC-Solo/brass-birmingham](https://github.com/KDC-Solo/brass-birmingham) (motor fan en inglés)

## Qué añade esta edición

- Interfaz completa en español y diseño móvil (vertical y horizontal).
- APK Android (Capacitor), icono propio, modo oscuro y texto grande.
- Asistente de jugadas, leyenda del mapa, guía de casillas y mercados explicados.
- Tutorial interactivo, guía de estrategia y mat de fichas estilo PC.
- Zoom/arrastre del tablero, popups de ciudad/comerciante, guardado automático.

## Desarrollo

```sh
npm install
npm run dev
npm test
npm run build
```

## APK Android

```sh
npm run build
npx cap sync android
cd android && ./gradlew.bat assembleDebug   # Windows
```

Requiere **JDK 21** para compilar con Capacitor 8.

## Descargar APK

Instala la última versión desde [GitHub Releases](https://github.com/Lendherm/brass-birmingham-mobile-es/releases/latest) (archivo `Brass-Birmingham-Edicion-Movil.apk`).

## Créditos y aviso legal

- **Brass: Birmingham** — Gavan Brown, Matt Tolman, Martin Wallace · [Roxley Games](https://roxley.com).
- **Mautoma** — Mauro Gibertoni · [mautoma.com](https://www.mautoma.com/brass-birmingham).
- Proyecto **fan no oficial**. Sin arte ni texto del editor — tablero esquemático original.
