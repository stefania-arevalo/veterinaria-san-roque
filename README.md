<div align="center">

<p align="center">
  <img src="./client/public/logocolor.png" width="180" alt="San Roque"/>
</p>

# Clínica Veterinaria San Roque

Sistema web integral para la gestión de una clínica veterinaria — clientes, pacientes, turnos, historia clínica, tratamientos, stock y más.

<br/>

![Estado](https://img.shields.io/badge/Estado-En%20desarrollo-0f6e56?style=flat-square&labelColor=085041)
![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Vite-61dafb?style=flat-square&logo=react&logoColor=white&labelColor=1a1a2e)
![Backend](https://img.shields.io/badge/Backend-Node.js%20+%20Express-339933?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=1a1a2e)
![Base de datos](https://img.shields.io/badge/Database-MySQL-4479a1?style=flat-square&logo=mysql&logoColor=white&labelColor=1a1a2e)
![ORM](https://img.shields.io/badge/ORM-Sequelize-52B0E7?style=flat-square&logo=sequelize&logoColor=white&labelColor=1a1a2e)

</div>

---

## ✨ Funcionalidades

| Módulo | Descripción |
|---|---|
| 👤 **Usuarios y roles** | Gestión de acceso y permisos por rol |
| 👨‍⚕️ **Personal** | Administración del equipo de la clínica |
| 🐶 **Clientes y pacientes** | Registro completo de dueños y mascotas |
| 📅 **Turnos y agenda** | Programación y seguimiento de citas |
| 📋 **Historia clínica** | Historial médico por paciente |
| 💉 **Tratamientos y vacunas** | Control de vacunación y medicación |
| 💰 **Ventas** | Venta de productos y medicamentos |
| 📦 **Stock e inventario** | Control de existencias en tiempo real |
| 🚚 **Compras y proveedores** | Gestión de abastecimiento |
| 🌐 **Portal de clientes** | Acceso externo para dueños de mascotas |

---

## 💻 Stack tecnológico

### Frontend
- **React** con **Vite** — build ultrarrápido
- **React Router DOM** — navegación SPA
- **Axios** — llamadas HTTP al backend
- **Tailwind CSS** — estilos utilitarios

### Backend
- **Node.js** + **Express** — servidor REST
- **Sequelize** — ORM para MySQL
- **JWT** — autenticación con tokens
- **MySQL** — base de datos relacional

---

## 📁 Estructura del proyecto

```
veterinaria-san-roque/
├── client/                  # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
└── server/                  # Backend Node.js
    ├── controllers/
    ├── models/
    ├── routes/
    ├── validators/
    ├── .env.example
    └── package.json
```

---

## 🚀 Instalación local

### Requisitos previos
- Node.js v18+
- MySQL 8+

### 1. Clonar el repositorio

```bash
git clone https://github.com/stefania-arevalo/veterinaria-san-roque.git
cd veterinaria-san-roque
```

### 2. Configurar el backend

```bash
cd server
npm install
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

Variables de entorno necesarias (`.env`):
```env
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=veterinaria_san_roque
JWT_SECRET=una_clave_secreta_larga
```

Iniciar el servidor:
```bash
npm run dev
```

### 3. Configurar el frontend

```bash
cd client
npm install
```

Crear un archivo `.env` en `/client`:
```env
VITE_API_URL=http://localhost:3000/api
```

Iniciar el frontend:
```bash
npm run dev
```

---

## ☁️ Deploy

### Frontend → [Vercel](https://vercel.com)
1. Conectar el repositorio en Vercel
2. Configurar el directorio raíz como `client`
3. Agregar la variable de entorno `VITE_API_URL` apuntando al backend en producción

### Backend → [Render](https://render.com) *(free tier)*
1. Crear un nuevo **Web Service** en Render conectado al repo
2. Configurar directorio raíz: `server`
3. Build command: `npm install`
4. Start command: `node index.js` (o `npm start`)
5. Agregar las variables de entorno desde `.env.example`

### Base de datos MySQL → [TiDB Cloud](https://tidbcloud.com) *(free tier, sin límite de tiempo)*
Compatible 100% con MySQL. Plan gratuito permanente.

1. Crear cuenta y un nuevo cluster en TiDB Cloud
2. Obtener los datos de conexión
3. Actualizar las variables `DB_*` en Render

---

<div align="center">
<sub>Desarrollado por <a href="https://github.com/stefania-arevalo">Stefania Arévalo</a></sub>
</div>