# Stock Plot Center v2.0

Sistema de gestión de stock migrado a React, Vercel y Neon PostgreSQL.

## 🚀 Tecnologías

- **Frontend**: React 18 + Vite
- **Backend**: Vercel Serverless Functions
- **Base de Datos**: Neon PostgreSQL (serverless)
- **Deploy**: Vercel
- **UI**: Tailwind CSS + Lucide Icons
- **Charts**: Chart.js
- **AI**: Google Gemini (PlotAI)
- **Autenticación**: JWT

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de [Neon](https://neon.tech) (PostgreSQL serverless)
- Cuenta de [Vercel](https://vercel.com)
- API Key de Google Gemini (opcional, para PlotAI)

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/webplotcentersj-hash/stock2.git
   cd stock2
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crear archivo `.env.local` en la raíz del proyecto:
   ```env
   DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require
   JWT_SECRET=tu-secret-key-super-segura-cambiar-en-produccion
   VITE_GEMINI_API_KEY=tu_gemini_api_key
   ```

   **Para producción en Vercel:**
   - Ir a Vercel Dashboard > Settings > Environment Variables
   - Agregar las mismas variables

4. **Configurar Neon PostgreSQL**
   - Crear un nuevo proyecto en [Neon](https://neon.tech)
   - Copiar la connection string (DATABASE_URL)
   - Ejecutar el script SQL en `neon/schema.sql` en el SQL Editor de Neon
   - Ejecutar `neon/migration_helper.sql` si es necesario

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📦 Deploy en Vercel

1. **Conectar repositorio a Vercel**
   - Ir a [Vercel](https://vercel.com)
   - Importar proyecto desde Git
   - Configurar variables de entorno en Vercel Dashboard:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `VITE_GEMINI_API_KEY` (opcional)

2. **Configurar Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Deploy**
   - Vercel detectará automáticamente el proyecto
   - El deploy se realizará en cada push a la rama principal

## 🗄️ Estructura de la Base de Datos

El esquema de base de datos está en `neon/schema.sql`. Las tablas principales son:

- `users` - Usuarios del sistema
- `articulos` - Artículos/Productos en stock
- `pedidos` - Pedidos de clientes
- `pedidos_items` - Items de cada pedido
- `ordenes_compra` - Órdenes de compra
- `movimientos_caja` - Movimientos de caja
- `notifications` - Notificaciones

## 🔐 Autenticación

El sistema usa JWT para autenticación. Los usuarios deben:

1. Estar registrados en la tabla `users` con contraseña hasheada (bcrypt)
2. Hacer login a través de `/api/login`
3. El token JWT se almacena en localStorage

Para crear un usuario inicial:
```sql
INSERT INTO users (id, email, password, name, role)
VALUES (
  gen_random_uuid(),
  'admin@example.com',
  '$2a$10$...', -- Hash bcrypt de la contraseña
  'Administrador',
  'administración'
);
```

## 📁 Estructura del Proyecto

```
├── api/                    # Vercel Serverless Functions
│   ├── db.js              # Conexión a Neon
│   ├── auth.js            # Utilidades de autenticación JWT
│   ├── login.js           # Endpoint de login
│   ├── stock.js           # API de stock
│   ├── pedidos.js         # API de pedidos
│   ├── compras.js         # API de compras
│   ├── caja.js            # API de caja
│   └── dashboard.js       # API de dashboard
├── src/
│   ├── components/        # Componentes reutilizables
│   ├── contexts/         # Contextos de React (Auth)
│   ├── lib/              # Utilidades (API client)
│   ├── pages/            # Páginas principales
│   ├── services/         # Servicios API
│   ├── utils/            # Utilidades
│   ├── App.jsx           # Componente principal
│   ├── main.jsx          # Punto de entrada
│   └── index.css         # Estilos globales
├── neon/
│   └── schema.sql        # Esquema de base de datos
├── public/               # Archivos estáticos
└── package.json
```

## 🎨 Funcionalidades

- ✅ Gestión de Stock (CRUD) con filtros por sector
- ✅ Gestión de Pedidos con items y aprobación
- ✅ Items de Pedidos (artículos asociados)
- ✅ Órdenes de Compra con filtros por estado
- ✅ Movimientos de Caja con filtros por tipo
- ✅ Dashboard con estadísticas
- ✅ Sistema de roles y permisos
- ✅ Integración con Gemini AI (PlotAI)
- ✅ Filtros avanzados en todas las secciones
- ✅ Logo de Plot Center integrado

## 🔒 Seguridad

- Autenticación mediante JWT
- Contraseñas hasheadas con bcrypt
- Validación de permisos por rol en el backend
- Variables de entorno para credenciales sensibles

## 📝 Notas de Migración desde Supabase

### Cambios principales:

1. **Base de Datos**: De Supabase a Neon PostgreSQL directo
2. **Autenticación**: De Supabase Auth a JWT propio
3. **Storage**: Ya no hay Supabase Storage (usar Cloudinary o similar)
4. **Backend**: API con Vercel Serverless Functions en lugar de Supabase client

### Funcionalidades Pendientes:

- [ ] Sistema de comentarios en pedidos
- [ ] Mensajería entre usuarios
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes
- [ ] Integración completa de PlotAI en UI
- [ ] Upload de imágenes a Cloudinary o similar

## 🐛 Troubleshooting

### Error de conexión a Neon
- Verificar que `DATABASE_URL` esté correctamente configurada
- Verificar que la conexión use SSL (`?sslmode=require`)
- Revisar que el proyecto Neon esté activo

### Error de autenticación
- Verificar que `JWT_SECRET` esté configurado
- Verificar que el usuario exista en la tabla `users`
- Verificar que la contraseña esté hasheada correctamente

### Error en API routes
- Verificar que las funciones estén en la carpeta `api/`
- Verificar que Vercel esté configurado para usar Serverless Functions

## 📄 Licencia

Propietario - Stock Plot Center

## 👥 Soporte

Para soporte, contactar al equipo de desarrollo.
