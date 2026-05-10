# Para Mari · Deploy en Vercel + Supabase

Esta guía te lleva de cero a un sitio público con base de datos real, donde tú subes fotos desde donde sea (incluso el celular) y **Mari las ve sin redeploy**.

Es 100% gratis con los free tiers de Vercel y Supabase.

---

## Resumen de la arquitectura

```
   Mari (móvil/desktop)               Joel (admin)
        │                                 │
        ▼                                 ▼
   ┌─────────────────────────────────────────────┐
   │      Vercel — sitio estático + /api/*       │
   │   (HTML, JS, Three.js, image-slot, cms.js)  │
   └────────────┬────────────────────┬───────────┘
                │ GET /api/slots     │ POST /api/upload (con password)
                ▼                    ▼
   ┌─────────────────────────────────────────────┐
   │            Supabase (gratis)                │
   │  · Postgres tabla `slots` (manifest)        │
   │  · Storage bucket `photos` (las imágenes)   │
   └─────────────────────────────────────────────┘
```

**El flujo en una línea:** Joel sube foto → API valida password → guarda en Supabase Storage → actualiza tabla → Mari recarga y la ve.

---

## 1 · Crear cuenta en Supabase

1. Entra a https://supabase.com → **Start your project** (sign in con GitHub).
2. **New project**:
   - Name: `para-mari`
   - Database password: una larga (cópiala — no la usarás casi)
   - Region: la más cercana a ti
   - Click **Create new project** (tarda ~2 min en aprovisionar)

## 2 · Crear la tabla y el bucket

**A. Tabla `slots`:**

1. En tu proyecto de Supabase: **SQL Editor** → **New query**
2. Pega el contenido completo de `supabase-schema.sql` (está en este repo)
3. Click **Run**

**B. Bucket `photos`:**

1. Ve a **Storage** (en el menú izquierdo)
2. Click **New bucket**
3. Name: `photos`
4. **Marca "Public bucket"** (importante — Mari necesita leer las imágenes)
5. Click **Save**

## 3 · Copiar las credenciales

En tu proyecto de Supabase ve a **Settings → API**. Copia estas tres cosas (las usarás en Vercel):

| Lo que copias | De dónde | Para qué |
|---|---|---|
| **Project URL** (`https://xxx.supabase.co`) | sección "Project URL" | conexión |
| **service_role key** (la secreta, larga) | sección "Project API keys" → **service_role** | escribir desde el servidor |
| ~~`anon` key~~ | NO la usamos | (se ignora) |

> ⚠️ La `service_role` key tiene permisos totales sobre tu proyecto. **Nunca la pongas en el código del cliente** — solo en variables de entorno de Vercel. Si se filtra: **Settings → API → Reset service role key**.

## 4 · Subir el código a GitHub

Si todavía no lo hiciste:

```powershell
cd "c:\Users\joe\Downloads\cumpleaños amor\Dia de la madre"
git init
git add .
git commit -m "Para Mari + Supabase"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/para-mari.git
git push -u origin main
```

## 5 · Conectar a Vercel

1. https://vercel.com → Sign up con GitHub si todavía no
2. **Add New… → Project** → selecciona `para-mari`
3. Framework preset: **Other** · Build command: vacío · Output directory: vacío
4. **Antes de hacer deploy**, expande **Environment Variables** y añade tres:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | la "Project URL" que copiaste |
   | `SUPABASE_SERVICE_ROLE_KEY` | la `service_role` key (larga) |
   | `ADMIN_PASSWORD` | la contraseña que usarás tú para subir fotos. Pon algo único. Ejemplo: `marifebrero2023!` |

5. Click **Deploy** — tarda ~30 seg.

¡Listo! Tienes `https://para-mari-xxx.vercel.app/`.

## 6 · Usar el dashboard de admin

El sitio incluye un **dashboard real** en una página aparte:

```
https://para-mari-xxx.vercel.app/admin
```

(También responde `https://.../admin.html`.)

**Login:** te pide la contraseña → la que pusiste en `ADMIN_PASSWORD` en Vercel. Queda guardada en este navegador.

**Lo que puedes editar desde el dashboard:**
- **Inicio** — título, blurb, fecha, stats, marquee
- **La madre** — badge, párrafos, foto principal
- **Carta** — saludo, párrafos (el efecto de typewriter respeta tu texto), firma
- **Jardín 3D** — copy de la sección (el render 3D es procedural)
- **Nuestros días** — añade/quita/reordena momentos de la timeline
- **Memorias / Fotos** — sube/cambia/borra cada foto, edita captions
- **Quotes** — añade/quita citas
- **Receta** — ingredientes, cantidades, footnote
- **Razones** — las 8 (o las que quieras), título + dorso
- **Promesas** — añade/quita
- **Música, Cielo, Corazón, Regalo, Final, Footer, Nav** — todo el copy
- **Meta** — título de la página, texto del boot loader

**Cada foto:** arrástrala al marco, doble-click para reencuadrar (zoom + pan).

**Mari, abriendo el sitio sin `/admin`, ve los cambios sin redeploy.**

## 7 · Cambiar la contraseña

En Vercel → tu proyecto → **Settings → Environment Variables** → edita `ADMIN_PASSWORD` → **Save** → **Redeploy** (Vercel necesita reiniciar las funciones).

En tu navegador, borra `localStorage.removeItem('mari-admin-pw')` o usa el botón **Salir** del dashboard.

---

## Probar localmente con Supabase

El sitio funciona en local sin Supabase (modo IDB). Si quieres probar con Supabase desde tu PC antes de desplegar, instala el CLI de Vercel:

```powershell
npm install -g vercel
cd "c:\Users\joe\Downloads\cumpleaños amor\Dia de la madre"
vercel link        # conecta este folder con el proyecto de Vercel
vercel env pull    # descarga las env vars como .env.local
vercel dev         # corre el sitio + funciones en http://localhost:3000
```

Luego abre `http://localhost:3000/?admin=joel`. Te pedirá la contraseña, y las subidas van a tu Supabase real.

---

## Troubleshooting

**"supabase not configured"** al hacer GET /api/slots → faltan las env vars o están mal escritas. Vercel → Settings → Environment Variables → revisa los nombres exactos y haz **Redeploy**.

**"unauthorized"** al subir → la contraseña no coincide. Borra `mari-admin-pw` del localStorage (DevTools → Application → Local Storage → borrar la entrada) y vuelve a intentar.

**La barra dice "local (sin servidor)"** → /api/slots no responde. Mira los logs en Vercel (Project → Deployments → último → Functions → ver logs). Suele ser un typo en `SUPABASE_URL` o falta el `service_role` key.

**"upload failed: ..."** → mira los logs. Las causas comunes:
- Bucket `photos` no existe o no es público
- La tabla `slots` no se creó (vuelve al paso 2A)
- Imagen >6 MB (rarísimo, image-slot ya redimensiona a max 1200px / ~400KB)

**Las fotos no se ven al cargar** (con el bucket público) → verifica en Supabase Storage → photos que la imagen está y haz click en **Get URL** para confirmar que es accesible. Si no lo es, el bucket está privado.

**Quiero ver/borrar fotos directamente en Supabase** → Storage → photos → puedes borrar archivos y revisar qué hay almacenado. La tabla `slots` también es editable directamente desde Table Editor.

---

## Costos (todo gratis con margen amplio)

| Recurso | Free tier | Lo que vas a usar |
|---|---|---|
| Vercel — bandwidth | 100 GB / mes | < 1 GB |
| Vercel — invocaciones de funciones | 100K / mes | < 1K |
| Supabase — Postgres | 500 MB | < 100 KB |
| Supabase — Storage | 1 GB | ~ 5-50 MB de fotos |
| Supabase — bandwidth | 5 GB / mes | < 100 MB |

Por más que Mari abra el sitio 1000 veces al día, no te acercas al límite.

---

## Borrar todo si quieres empezar de cero

1. **Supabase**: Storage → photos → seleccionar todo → eliminar
2. **Supabase**: SQL Editor → `delete from slots;`
3. **Local**: en el sitio, modo admin → **Limpiar**

---

**Cualquier duda,** mira los archivos:
- `api/upload.js`, `api/slots.js`, `api/delete.js`, `api/recrop.js`, `api/verify.js` — funciones serverless
- `cms.js` — cliente que orquesta diff + sync
- `supabase-schema.sql` — esquema SQL
- `package.json` — solo una dependencia: `@supabase/supabase-js`

Todo el código está comentado.
