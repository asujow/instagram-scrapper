# Instagram Profile Tagger

Aplicación local para importar, organizar y etiquetar perfiles de Instagram a partir de URLs o nombres de usuario.

Permite gestionar una base de datos simple de perfiles, añadir etiquetas personalizadas (ej: *alto, musculoso, fitness*), filtrar perfiles por etiquetas y obtener automáticamente la foto de perfil mediante scraping.

---

## 🚀 Features

- Importación de URLs de Instagram o usernames
- Extracción automática de usernames
- Scraping básico de foto de perfil (Playwright)
- Sistema de etiquetas personalizables
- Filtrado de perfiles por tags
- Persistencia en archivo JSON (sin base de datos SQL)
- Interfaz web simple en React

---

## 🧱 Tech Stack

### Frontend
- React + Vite
- Tailwind CSS

### Backend
- Node.js
- Express
- Playwright (scraping)

### Storage
- JSON file (`db.json`)

---

## 📁 Project Structure
instagram-profile-tagger/
├── backend/
│ ├── data/db.json
│ ├── services/
│ ├── utils/
│ └── server.js
│
├── frontend/
│ ├── src/
│ ├── components/
│ └── App.jsx
---

## ⚙️ Installation

### 1. Clone repo

bash>>
git clone https://github.com/your-username/instagram-profile-tagger.git
cd instagram-profile-tagger
2. Install backend
cd backend
npm install
npx playwright install
3. Install frontend
cd ../frontend
npm install
▶️ Run project
Backend
cd backend
npm run dev
Frontend
cd frontend
npm run dev

Or run both (if configured):

npm run dev
📦 Data format

Stored in backend/data/db.json:

{
  "profiles": [
    {
      "username": "example.user",
      "tags": ["fitness", "alto"],
      "imageUrl": "https://..."
    }
  ],
  "tags": ["fitness", "alto", "musculoso"]
}
🧠 Future improvements
Tag filtering UI avanzado
Search de perfiles
Notas por perfil
Favoritos
Scraping en background queue
Exportación CSV / JSON
Modo desktop con Electron
Login multiusuario
⚠️ Disclaimer

Este proyecto es para uso personal y educativo. El scraping de Instagram puede estar sujeto a sus términos de uso.
