# Brass Birmingham — Edición Móvil (ES)



Versión móvil en español de **Brass: Birmingham** con interfaz optimizada para teléfono y APK Android.



**App:** Brass Móvil ES  

**Autor:** [Nathanael De la Rosa](https://github.com/Lendherm)  

**Repositorio:** [Lendherm/brass-birmingham-mobile-es](https://github.com/Lendherm/brass-birmingham-mobile-es)  

**Basado en:** [KDC-Solo/brass-birmingham](https://github.com/KDC-Solo/brass-birmingham) (motor fan en inglés)



## Modos de juego



| Modo | Reglas | Para qué sirve |

|------|--------|----------------|

| **Mautoma (solo)** | Variante fan con baraja recortada | Partidas rápidas contra Automa |

| **Contra IA** | Brass oficial completo | Practicar vs bot con entrenador 🎓 |

| **Multijugador local** | Hotseat 2–4 jugadores | Pasar el teléfono entre humanos |

| **Entrenamiento** | Escenarios fijos + drills | Posiciones tipo torneo |



### IA y entrenamiento



- Dificultades: Fácil, Media, Difícil y **Torneo (MCTS ~350 ms)**

- Entrenador comparativo con confianza % y repaso jugada a jugada

- Panel 📊: Elo local, metas semanales, exportación JSON/CSV

- Drills por debilidad y entrenador opcional en hotseat



## Desarrollo



```sh

npm install

npm run dev      # web local

npm test         # 157+ tests

npm run build

npm run tune:ai  # calibrar pesos del evaluador (offline, lento)

```



Requiere **Node 22** y **JDK 21** (Capacitor 8).



## APK Android



### Debug local



```sh

npm run build

npx cap sync android

cd android && ./gradlew.bat assembleDebug   # Windows

```



### Release local



```sh

npm run build

npx cap sync android

# Opcional: firma (ver abajo)

cd android && ./gradlew.bat assembleRelease

```



El APK sale en `android/app/build/outputs/apk/release/`.



### Firma de release



1. Genera un keystore (solo una vez):



   ```powershell

   .\scripts\generate-keystore.ps1

   ```



2. Compila firmado en local:



   ```powershell

   $env:ANDROID_KEYSTORE_PATH = "app/release.keystore"

   $env:ANDROID_KEYSTORE_PASSWORD = "tu-store-pass"

   $env:ANDROID_KEY_ALIAS = "brass-mobile"

   $env:ANDROID_KEY_PASSWORD = "tu-key-pass"

   cd android; .\gradlew.bat assembleRelease

   ```



3. Para **CI automática** en GitHub, añade estos secrets al repo:



   | Secret | Valor |

   |--------|-------|

   | `ANDROID_KEYSTORE_BASE64` | Keystore en base64 |

   | `ANDROID_KEYSTORE_PASSWORD` | Contraseña del store |

   | `ANDROID_KEY_ALIAS` | `brass-mobile` |

   | `ANDROID_KEY_PASSWORD` | Contraseña de la clave |



   Sin secrets, CI usa `android/signing.properties` y keystore de release incluido en el repo.

   **Importante:** si ya instalaste v1.0.10–v1.0.12, desinstala la app antes de instalar v1.0.13 (cambió la firma).



## Releases automáticas



Cada tag `v*.*.*` dispara GitHub Actions:



1. Tests + build web

2. Compilación Android

3. Publicación en [Releases](https://github.com/Lendherm/brass-birmingham-mobile-es/releases) con `Brass-Birmingham-Edicion-Movil.apk`



```sh

git tag v1.0.11

git push origin v1.0.11

```



## Descargar APK



[GitHub Releases — última versión](https://github.com/Lendherm/brass-birmingham-mobile-es/releases/latest)



## Changelog



Ver [CHANGELOG.md](./CHANGELOG.md).



## Créditos y aviso legal



- **Brass: Birmingham** — Gavan Brown, Matt Tolman, Martin Wallace · [Roxley Games](https://roxley.com).

- **Mautoma** — Mauro Gibertoni · [mautoma.com](https://www.mautoma.com/brass-birmingham).

- Proyecto **fan no oficial**. Sin arte ni texto del editor — tablero esquemático original.

