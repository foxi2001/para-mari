# Para Mari · Deploy a Vercel (gratis)

Este sitio es 100% estático — HTML + JS sin build. Vercel lo sirve gratis en su plan **Hobby**, sin tarjeta.

---

## 1. Sube el proyecto a GitHub

```powershell
cd "c:\Users\joe\Downloads\cumpleaños amor\Dia de la madre"
git init
git add .
git commit -m "Para Mari — Día de la Madre"
git branch -M main
```

Crea un repo nuevo en https://github.com/new (privado o público — da igual). Después:

```powershell
git remote add origin https://github.com/TU-USUARIO/para-mari.git
git push -u origin main
```

> Si nunca has usado git en este equipo, instálalo desde https://git-scm.com y configura tu nombre/email:
> ```powershell
> git config --global user.name "Joel"
> git config --global user.email "tu-email@ejemplo.com"
> ```

---

## 2. Conecta a Vercel (3 clicks)

1. Entra a https://vercel.com y haz **Sign up** con GitHub.
2. **New Project** → selecciona el repo `para-mari`.
3. Framework preset: **Other** (es estático). Build command: vacío. Output directory: vacío.
4. Click **Deploy**.

En ~30 segundos tendrás una URL tipo `para-mari-xyz.vercel.app`. Compártesela a Mari.

---

## 3. Subir las fotos (modo admin)

El sitio incluye un **CMS interno** que guarda tus fotos en el navegador y exporta un bundle para que se vean en producción.

### Cómo cargar fotos:

1. Abre tu sitio con `?admin=joel` al final:
   `https://para-mari-xyz.vercel.app/?admin=joel`
2. Verás abajo una **barra negra de admin**.
3. Arrastra cualquier foto a los marcos vacíos (en la galería, retrato, receta, etc.).
4. Doble-click sobre una foto para reencuadrarla (zoom, panear).
5. Cuando termines, click en **"Exportar fotos"** → te descarga un archivo `.image-slots.state.json`.
6. Pon ese archivo **en la raíz del proyecto** (junto a `index.html`).
7. Commit + push:
   ```powershell
   git add .image-slots.state.json
   git commit -m "Fotos para Mari"
   git push
   ```
8. Vercel lo redeploya automáticamente en ~30 seg.

Mari, abriendo el sitio sin `?admin`, verá las fotos exactas que subiste.

### Trucos del modo admin:

- **Importar fotos**: si quieres recuperar un bundle, click en *Importar* y selecciona el `.json`.
- **Limpiar**: borra todas las fotos guardadas en este navegador.
- **Salir**: cierra el modo admin (vuelve la URL normal).

---

## 4. Personalizar más cosas

Las frases ya están personalizadas con:
- "Para mi chinita, para mi Mari"
- "Llevamos casi 3 años"
- "Te amo por todo lo que pasamos"
- "Hecho por JOEL con mucho cariño"

Si quieres cambiar algo:
- **Hero / Letter / Footer**: edita `sections.jsx` (busca el texto que quieras cambiar).
- **Quotes / Recipe / Finale**: edita `more-sections.jsx`.
- **Boot loader**: edita `index.html` (sección `<div id="boot">`).

Cualquier cambio: `git add . && git commit -m "tweak" && git push` y Vercel rebuild.

---

## 5. Dominio personalizado (opcional)

Si quieres una URL más bonita:
1. Compra un dominio (ej. `paraMari.love` en Namecheap o Porkbun, ~$10/año).
2. En Vercel: **Project Settings → Domains → Add**.
3. Sigue las instrucciones para apuntar los DNS (toma 1-24h).

O usa el subdominio gratis: `para-mari-xyz.vercel.app`.

---

## 6. Checklist rápido antes de mandárselo a Mari

- [ ] Has cargado las fotos via `?admin=joel`
- [ ] Has descargado el bundle y lo has commiteado al repo
- [ ] Vercel marca el deploy como "Ready"
- [ ] Has abierto la URL final desde otro navegador (ventana incógnita) y se ven las fotos
- [ ] Le mandas el link sin `?admin=joel` ✨

---

## Notas técnicas

- **Stack**: HTML + React (UMD) + Babel runtime + Three.js — sin bundler ni build.
- **CMS**: IndexedDB local + export a JSON estático en el repo.
- **Fotos**: codificadas en WebP base64 dentro del JSON (resize automático a max 1200px).
- **3D**: Three.js r160, rosas procedurales con `MeshPhysicalMaterial` (sheen, clearcoat).
- **Audio**: Web Audio API — la melodía se sintetiza nota a nota en el navegador.
- **Vercel free tier**: 100 GB bandwidth/mes, hosting estático ilimitado. Con un sitio así, vas sobrado.

Cualquier duda: revisa la consola del navegador (F12). Todo el código está comentado y es legible.
