# Instalar Brass Móvil ES en Linux (app de escritorio)

La versión para PC es una **PWA** (Progressive Web App): una app ligera (~3 MB en caché) que se instala desde el navegador y recibe actualizaciones automáticas cuando publicamos una nueva versión en GitHub.

**URL pública:** https://lendherm.github.io/brass-birmingham-mobile-es/

---

## Requisitos

- **Chrome**, **Chromium**, **Edge** o **Brave** (navegador basado en Chromium).
- Conexión a internet la primera vez (para descargar la app).

Firefox también puede instalar PWAs en versiones recientes, pero la experiencia más estable en Linux es con Chromium.

---

## Instalación paso a paso

### 1. Abrir la app en el navegador

Abre esta URL en Chrome o Chromium:

```
https://lendherm.github.io/brass-birmingham-mobile-es/
```

Espera a que cargue la pantalla de inicio del juego.

### 2. Instalar como aplicación

**Opción A — icono en la barra de direcciones**

- Busca el icono **⊕** o **Instalar** a la derecha de la barra de direcciones.
- Haz clic en **Instalar** o **Instalar Brass Móvil ES**.

**Opción B — menú del navegador**

1. Menú **⋮** (tres puntos) arriba a la derecha.
2. **Instalar Brass Móvil ES…** (o **Crear acceso directo…** → marcar *Abrir como ventana*).
3. Confirma con **Instalar**.

### 3. Abrir la app

La app aparecerá en el menú de aplicaciones de tu escritorio (GNOME, KDE, Xfce, etc.) como **Brass Móvil ES**. Puedes fijarla al dock o panel como cualquier otra app.

---

## Actualizaciones

Cada vez que abres la app instalada, comprueba si hay una versión nueva en GitHub Pages.

- Si hay actualización, verás un aviso: **«Hay una nueva versión disponible»**.
- Pulsa **Actualizar ahora** para recargar con la última versión.

No hace falta volver a descargar ni reinstalar manualmente.

---

## Atajos útiles

| Acción | Cómo |
|--------|------|
| Abrir en ventana propia | Desde el lanzador del sistema |
| Desinstalar | Menú del sistema → clic derecho en la app → Desinstalar, o en Chrome: `chrome://apps` → clic derecho → Eliminar |
| Jugar sin instalar | Usa la URL en el navegador (funciona igual, pero sin icono en el escritorio) |

---

## Alternativa: servidor local (desarrolladores)

Si clonas el repositorio y quieres probar en local:

```bash
git clone https://github.com/Lendherm/brass-birmingham-mobile-es.git
cd brass-birmingham-mobile-es
npm ci
npm run dev
```

Abre http://localhost:5173 e instala la PWA desde ahí. Las actualizaciones locales dependen de tu build; la versión publicada en GitHub Pages es la recomendada para jugar.

Con Docker:

```bash
docker compose up web
```

Abre http://localhost:8080.

---

## Android

Para móvil Android, descarga el APK desde [Releases](https://github.com/Lendherm/brass-birmingham-mobile-es/releases/latest).

---

## Problemas frecuentes

**No aparece «Instalar»**

- Usa Chrome/Chromium (no un navegador muy antiguo).
- La página debe cargarse por **HTTPS** (GitHub Pages ya lo proporciona).
- Prueba en una ventana normal, no en modo incógnito.

**La app no se actualiza**

- Cierra todas las ventanas de Brass Móvil ES y ábrela de nuevo.
- Si persiste: en Chrome, `chrome://apps` → clic derecho en la app → **Eliminar**, y vuelve a instalar desde la URL.

**Pantalla en blanco al abrir**

- Comprueba tu conexión a internet.
- Borra caché del sitio en ajustes del navegador y recarga.

---

Autor: [Nathanael De la Rosa](https://github.com/Lendherm) · Código: [brass-birmingham-mobile-es](https://github.com/Lendherm/brass-birmingham-mobile-es)
