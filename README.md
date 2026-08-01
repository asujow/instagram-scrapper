# 📸 Instagram Profile Tagger

Herramienta personal para **importar, organizar, etiquetar y llevar seguimiento de perfiles de Instagram**. Pensada para un solo usuario, corriendo en local — no es un producto público ni tiene login.

---

## ✨ Qué hace

- **Importar perfiles** pegando texto, subiendo un `.txt`, o cargando un `.json` de base de datos completo. Reconoce URLs de Instagram (con o sin parámetros, incluso varias pegadas sin saltos de línea), `@usuarios` y usernames sueltos.
- **Etiquetas normales**: crear, borrar, renombrar (el renombrado actualiza el tag y todos los perfiles que lo tengan a la vez), y filtrar la lista de perfiles por varias etiquetas a la vez (un perfil debe tener *todas* las seleccionadas).
- **Dos etiquetas especiales, con su propio color y lógica**:
  - 🔴 **`deleted`** — marca que el perfil se borró de Instagram. Se puede aplicar individualmente o en bloque.
  - 🔵 **`alt-account`** — marca que un perfil es una cuenta alternativa de otra. Solo se gestiona desde la página de perfil individual, donde eliges cuál es la cuenta principal; el sistema evita cadenas (una alt de una alt) y que una cuenta sea principal y alternativa a la vez.
- **Acciones en bloque** desde la lista de perfiles (selección múltiple): aplicar tag, marcar/desmarcar como borrado, borrar perfiles, y refrescar sus fotos.
- **Página de perfil individual**: foto, tags (añadir/quitar), marcar como borrado, gestionar cuenta alternativa (con enlaces clicables a la cuenta principal o a las alternativas), refrescar solo su foto, y borrar el perfil.
- **Descarga de fotos de perfil** vía Playwright (mejor esfuerzo — ver [limitaciones](#-limitaciones-conocidas) más abajo), como job en segundo plano con barra de progreso, para no bloquear la interfaz en importaciones grandes.
- **Borrar la base de datos entera** desde el Dashboard ("Danger Zone"), con confirmación explícita.
- Interfaz responsive: barra lateral en escritorio, navegación inferior en móvil.

---

## 🧱 Stack

- **Frontend**: React + Vite + Tailwind (vía CDN, no build de PostCSS)
- **Backend**: Node.js + Express
- **Scraping**: Playwright (Chromium headless)
- **Base de datos**: un único archivo JSON local (`backend/data/db.json`) — sin base de datos externa

---

## 📁 Estructura

```txt
instagram-scrapper/
├── backend/
│   ├── data/
│   │   ├── db.json          # toda la base de datos (gitignored)
│   │   └── images/          # fotos descargadas (gitignored)
│   ├── routes/
│   │   ├── profiles.js      # perfiles, tags en bloque, refresh de fotos, alt-account, borrado
│   │   ├── tags.js          # crear/borrar/renombrar tags
│   │   ├── import.js        # import de texto/.txt y de .json
│   │   └── database.js      # borrado completo de la base de datos
│   ├── services/
│   │   ├── instagramScraper.js  # scraping con Playwright
│   │   └── photoRefreshJob.js   # job en segundo plano + progreso
│   ├── utils/
│   │   ├── db.js                # lectura/escritura de db.json, validaciones
│   │   └── extractUsernames.js  # parseo de texto pegado a usernames
│   └── server.js
│
└── frontend/
    └── src/
        ├── pages/            # Dashboard, Import, Profiles, ProfileDetail, Tags
        ├── components/
        │   ├── layout/       # Layout, Sidebar (desktop), BottomNav (móvil)
        │   ├── profiles/     # ProfileCard, ProfileGrid, ProfileToolbar, TagChip
        │   ├── tags/         # TagManager, TagList
        │   ├── import/       # ManualImport, TxtUpload, JsonUpload
        │   └── dashboard/    # PhotoRefreshPanel
        ├── hooks/useAppData.js   # estado central: perfiles, tags, selección
        └── utils/
            ├── api.js            # helper compartido para llamadas a la API
            └── specialTags.js    # constantes y colores de deleted/alt-account
```

---

## 🚀 Instalación

### Backend

```bash
cd backend
npm install
npx playwright install     # navegadores necesarios para el scraping de fotos
npm run dev
```

Corre en `http://127.0.0.1:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Corre en `http://localhost:5173` — ábrelo en el navegador, no el puerto del backend.

### Variables de entorno (opcionales, todas con valores por defecto sensatos)

| Variable          | Por defecto              | Para qué sirve                                    |
|-------------------|---------------------------|----------------------------------------------------|
| `PORT`            | `3001`                    | Puerto del backend                                  |
| `HOST`            | `127.0.0.1`               | Interfaz de red donde escucha el backend            |
| `FRONTEND_ORIGIN` | `http://localhost:5173`   | Único origen permitido por CORS                     |

---

## 🔒 Seguridad y privacidad

Esta app **no tiene login ni autenticación** — se diseñó para un único usuario corriendo todo en su propia máquina, no para exponerse en una red ni a otros usuarios. Con eso en mente:

- El backend escucha solo en `127.0.0.1` por defecto — ningún otro dispositivo en tu red puede alcanzarlo.
- CORS está restringido al origen del frontend (`http://localhost:5173`) — una pestaña de otra página no puede llamar a la API desde JavaScript.
- Los usernames se validan (mismo patrón que usa Instagram: letras, números, `.` y `_`) antes de usarse para nombrar archivos en disco, tanto en el import de texto como en el import de JSON — esto evita que un archivo `db.json` corrupto o manipulado pueda escribir fuera de la carpeta de imágenes.
- `backend/data/db.json` y `backend/data/images/` están en `.gitignore` porque contienen tus datos reales (lista de perfiles, tags, fotos descargadas). Si compartes el proyecto (zip, repositorio, capturas), ten cuidado de no incluir esa carpeta por accidente.

Si alguna vez quieres exponer esto en una red (no recomendado sin añadir autenticación antes), cambia `HOST` y `FRONTEND_ORIGIN` — pero entonces cualquiera con acceso a esa red podría leer y borrar tus datos sin restricción.

---

## 🔗 API

Todas las rutas devuelven JSON. Las que modifican datos esperan `Content-Type: application/json`.

| Método | Ruta                                       | Qué hace                                                        |
|--------|---------------------------------------------|-------------------------------------------------------------------|
| GET    | `/api/profiles`                             | Lista todos los perfiles                                          |
| POST   | `/api/profiles/delete`                      | Borra uno o varios perfiles (`{ usernames: [...] }`)               |
| POST   | `/api/profiles/tags/bulk`                   | Aplica un tag a varios perfiles                                    |
| POST   | `/api/profiles/tags/bulk-remove`             | Quita un tag de varios perfiles                                    |
| DELETE | `/api/profiles/:username/tags/:tag`          | Quita un tag de un perfil concreto                                 |
| POST   | `/api/profiles/:username/alt-account`        | Vincula/desvincula una cuenta alternativa (`mainAccountUsername`)  |
| POST   | `/api/profiles/refresh-photos`               | Arranca la descarga de fotos en segundo plano (todas o una lista) |
| GET    | `/api/profiles/refresh-photos/status`        | Progreso del job de descarga de fotos                              |
| GET    | `/api/tags`                                 | Lista todas las etiquetas                                          |
| POST   | `/api/tags`                                 | Crea una etiqueta                                                  |
| PUT    | `/api/tags/:tag`                            | Renombra una etiqueta (y la actualiza en todos los perfiles)        |
| DELETE | `/api/tags/:tag`                            | Borra una etiqueta globalmente                                     |
| POST   | `/api/import`                               | Importa perfiles desde texto pegado o un `.txt`                    |
| POST   | `/api/import/json`                          | Reemplaza toda la base de datos con un `.json` subido               |
| POST   | `/api/database/reset`                       | Borra perfiles, tags y fotos — toda la base de datos                |
| GET    | `/images/:archivo`                          | Sirve las fotos descargadas                                        |

Las etiquetas `deleted` y `alt-account` están reservadas: no se pueden crear/borrar/renombrar por las rutas genéricas de tags, ni aplicar/quitar por las rutas genéricas de bulk — tienen su lógica propia (ver más arriba).

---

## 🧠 Modelo de datos (`backend/data/db.json`)

```jsonc
{
  "profiles": [
    {
      "username": "alguien",
      "tags": ["amigas", "deleted"],
      "imagePath": "images/alguien.jpg", // o null si no se ha descargado
      "mainAccountUsername": null,       // username de la cuenta principal, si esta es una alt
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "tags": ["amigas", "trabajo", "deleted", "alt-account"],
  "meta": { "createdAt": "...", "updatedAt": "..." }
}
```

---

## ⚠️ Limitaciones conocidas

- **La descarga de fotos no es 100% fiable.** Instagram bloquea activamente el scraping anónimo (avisos de cookies, muros de login, límites de peticiones) y esto cambia con el tiempo. El scraper ya maneja el aviso de cookies de la UE y valida que la imagen descargada venga de un dominio real de Instagram (no un gráfico de aviso), pero seguirá fallando en algunos perfiles — es esperado, no un bug.
- **Un solo job de fotos a la vez.** Si ya hay una descarga en marcha (por ejemplo "Refresh All Photos" desde el Dashboard) y lanzas otra desde otra pantalla, la segunda simplemente espera — no hay cola de varios trabajos.
- **Sin autenticación real.** Ver la sección de seguridad más arriba — este proyecto asume que solo tú tienes acceso a tu propia máquina.

---

## 🤖 Sobre el scraping

El scraper (`backend/services/instagramScraper.js`) usa Playwright para cargar la página pública del perfil (sin iniciar sesión), lee el `og:image` del HTML, y valida que la URL de la imagen venga de un dominio real de Instagram/Meta antes de descargarla. No usa la API de Instagram ni requiere una cuenta — y por tanto tampoco puede garantizar acceso a perfiles privados o fuertemente protegidos.

Respeta los términos de uso de Instagram si haces algo con esto más allá de un uso personal y moderado.
