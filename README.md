# 📸 Instagram Profile Tagger

Una aplicación full-stack para **importar, organizar y etiquetar perfiles de Instagram** desde URLs o usernames. Permite crear etiquetas personalizadas, filtrar perfiles y preparar datos para análisis o automatización con Playwright.

---

## ✨ Características

- 📥 Importación de perfiles desde archivos o texto
- 🧠 Extracción automática de usernames de Instagram
- 🏷️ Sistema de etiquetas personalizadas (alto, bajo, musculoso, etc.)
- 🔍 Filtro de perfiles por etiquetas
- 💾 Base de datos local en JSON
- 🤖 Preparado para automatización con Playwright
- ⚡ Frontend rápido con React + Vite

---

## 🧱 Stack

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express
- Automatización: Playwright
- Base de datos: JSON local

---

## 📁 Project Structure

```txt
project-root/
├── backend/
│   ├── data/              # JSON database
│   ├── services/          # Business logic
│   ├── utils/             # Helpers
│   ├── node_modules/
│   └── server.js          # Express API
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

---

## 🚀 Instalación

### Clonar el repositorio

```bash
git clone <repo-url>
cd project-root
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## ▶️ Ejecución

### Backend (Express)

```bash
cd backend
npm run dev
```

👉 http://localhost:3001

---

### Frontend (Vite)

```bash
cd frontend
npm run dev
```

👉 http://localhost:5173

---

## 🔗 API

| Método | Endpoint        | Descripción                |
|--------|----------------|----------------------------|
| GET    | /profiles       | Obtener perfiles           |
| POST   | /profiles       | Añadir perfiles            |
| PUT    | /profiles/:id   | Editar perfil o etiquetas  |
| DELETE | /profiles/:id   | Eliminar perfil           |

---

## 🧠 Cómo funciona

1. Importas URLs o usernames de Instagram
2. El backend normaliza los datos
3. Se guardan en JSON local
4. Puedes añadir etiquetas manualmente
5. Filtras perfiles por etiquetas

---

## 🤖 Playwright

Base preparada para automatización:

- Scraping de perfiles públicos
- Extracción de usernames
- Validación de URLs
- Posible expansión a análisis de datos

---

## ⚠️ Nota

Proyecto educativo. Respeta los términos de uso de Instagram.