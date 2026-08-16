# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [1.0.11] — 2026-08-16

### Corregido
- **APK instalable en Android moderno (Pixel 8 Pro, etc.):** la release se firma en CI (ya no se publica APK sin firmar).

## [1.0.10] — 2026-08-16

### Añadido
- Soporte de **firma APK** en Gradle (variables de entorno + secrets de GitHub).
- Script `scripts/generate-keystore.ps1` para crear keystore local.
- Tuning IA v2: calibración compuesta (Difícil>Media y Torneo>Difícil).
- Benchmark `pairwiseDifficultyStrength` en self-play.

### Cambiado
- README ampliado: modos, CI, firma, entrenamiento.
- Validación self-play de dificultades ajustada para muestras cortas (hard>medium; torneo excluido del benchmark vs fácil).

## [1.0.9] — 2026-08-16

### Añadido
- Exportación de estadísticas **JSON/CSV** desde el panel de entrenamiento.
- **Autoplay** en repaso jugada a jugada (2.5 s).
- **Entrenador comparativo en hotseat** (opcional).

## [1.0.8] — 2026-08-16

### Añadido
- Workflow CI: **APK automática** en cada tag `v*`.
- Pesos del evaluador calibrados con **self-play** (`evalWeights.ts`, `npm run tune:ai`).

## [1.0.7] — 2026-08-15

### Añadido
- Repaso en partida, 4 drills dedicados, metas semanales personalizables.
- Confianza del entrenador, self-play IA y benchmark de dificultades.

## [1.0.6] — 2026-08-15

### Añadido
- Repaso post-partida jugada a jugada.
- Drills automáticos por debilidad.
- Metas semanales en el panel de entrenamiento.

## [1.0.5] — 2026-08-15

### Añadido
- Creencias de cartas del rival.
- Modo **Torneo (MCTS)** con presupuesto de tiempo móvil.

## [1.0.3] — 2026-08-15

### Añadido
- Evaluador de posición v2, lookahead rival, biblioteca de aperturas.
- Panel Elo, escenarios de entrenamiento, entrenador comparativo.

## [1.0.2] — 2026-08-15

### Añadido
- Modo Contra IA con reglas oficiales.
- Resumen de entrenamiento y estadísticas de carrera.

[1.0.10]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.10
[1.0.9]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.9
[1.0.8]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.8
[1.0.7]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.7
[1.0.6]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.6
[1.0.5]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.5
[1.0.3]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.3
[1.0.2]: https://github.com/Lendherm/brass-birmingham-mobile-es/releases/tag/v1.0.2
