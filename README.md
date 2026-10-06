# Monedero

Monedero es una aplicación web para llevar un control sencillo de ingresos y
gastos. Permite registrar movimientos, consultarlos en un calendario, revisar
un balance por periodos y ver en qué categorías se concentra el gasto.

El proyecto está pensado como una aplicación pequeña pero completa: tiene un
cliente React, una API REST con Express y una base de datos MongoDB. La
autenticación se hace con JWT, por lo que cada usuario solo consulta sus
propios movimientos.

## Funcionalidades

- Registro e inicio de sesión.
- Gestión de ingresos y gastos.
- Edición y borrado de movimientos.
- Calendario mensual con el resumen de cada día.
- Balance total y análisis de los últimos 1, 2, 3, 6 o 12 meses.
- Gráficas de gastos agrupadas por categoría.
- Distinción entre pagos con tarjeta y efectivo.
- Categorías personalizadas guardadas en el navegador.
- Modo oscuro y edición del nombre del perfil.

## Tecnologías utilizadas

### Frontend

- **React 19** para construir la interfaz.
- **Vite** como servidor de desarrollo y herramienta de build.
- **Chart.js** y **react-chartjs-2** para las gráficas circulares.
- **CSS** con variables para el tema claro/oscuro y diseño responsive.
- **localStorage** para conservar la sesión, las preferencias y las categorías
  creadas por el usuario.

### Backend

- **Node.js** y **Express** para la API.
- **MongoDB** mediante **Mongoose** para guardar usuarios y transacciones.
- **bcryptjs** para no almacenar contraseñas en texto plano.
- **jsonwebtoken** para emitir y comprobar sesiones.
- **dotenv** para leer secretos y la URL de MongoDB desde variables de entorno.
- **cors** para permitir que el frontend desplegado consuma la API.

### Herramientas de trabajo

- **Git y GitHub** para control de versiones.
- **GitHub Actions** para construir y desplegar el frontend en GitHub Pages.
- **Render** para alojar la API y **MongoDB** como base de datos.

## Estructura del proyecto

```text
.
├── backend/
│   ├── index.js
│   ├── middleware/authMiddleware.js
│   ├── models/
│   └── routes/
├── frontend/
│   ├── src/App.jsx
│   ├── src/App.css
│   └── vite.config.js
└── .github/workflows/deploy.yml
```

## Puesta en marcha local

### 1. Instalar dependencias

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configurar el backend

Crea `backend/.env` (este archivo no debe subirse al repositorio):

```env
MONGO_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/monedero
JWT_SECRET=una-clave-larga-y-privada
PORT=5000
```

Arranca la API desde `backend/`:

```bash
npm run dev
```

### 3. Configurar el frontend

El frontend usa por defecto la API desplegada. Para trabajar contra la API
local, crea `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:5000/api
```

En otra terminal, desde `frontend/`:

```bash
npm run dev
```

Vite mostrará la dirección local, normalmente
`http://localhost:5173`.

## API disponible

Todas las rutas salvo registro y login esperan la cabecera
`Authorization: Bearer <token>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| `POST` | `/api/auth/registro` | Crear una cuenta |
| `POST` | `/api/auth/login` | Iniciar sesión |
| `PUT` | `/api/auth/perfil` | Cambiar el nombre del usuario |
| `GET` | `/api/transacciones` | Listar los movimientos propios |
| `POST` | `/api/transacciones` | Crear un movimiento |
| `PUT` | `/api/transacciones/:id` | Editar un movimiento |
| `DELETE` | `/api/transacciones/:id` | Eliminar un movimiento |

## Scripts

En `frontend/`:

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run preview  # servir el build localmente
npm run lint     # revisar el código
```

En `backend/`:

```bash
npm run dev      # API con recarga automática mediante nodemon
```