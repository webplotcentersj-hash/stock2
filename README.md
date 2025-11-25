# Stock Plot Center v2.0

Sistema de gestión de stock migrado a React, Vercel y Supabase.

## 🚀 Tecnologías

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deploy**: Vercel
- **UI**: Tailwind CSS + Lucide Icons
- **Charts**: Chart.js
- **AI**: Google Gemini (PlotAI)

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase
- Cuenta de Vercel
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
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con tus credenciales:
   ```env
   VITE_SUPABASE_URL=tu_supabase_url
   VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
   VITE_GEMINI_API_KEY=tu_gemini_api_key
   ```

4. **Configurar Supabase**
   - Crear un nuevo proyecto en [Supabase](https://supabase.com)
   - Ejecutar el script SQL en `supabase/schema.sql` en el SQL Editor
   - Ejecutar `supabase/migration_helper.sql`
   - Ejecutar `supabase/migrate_articulos.sql` para migrar los artículos
   - Crear buckets de Storage:
     - `articulos` (público)
     - `pedidos` (público)

5. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   ```

## 📦 Deploy en Vercel

1. **Conectar repositorio a Vercel**
   - Ir a [Vercel](https://vercel.com)
   - Importar proyecto desde Git
   - Configurar variables de entorno en Vercel Dashboard

2. **Configurar Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Deploy**
   - Vercel detectará automáticamente el proyecto
   - El deploy se realizará en cada push a la rama principal

## 🗄️ Migración de Datos

Para migrar datos desde MySQL a Supabase:

1. Exportar datos desde MySQL en formato CSV
2. Importar a Supabase usando el Dashboard o scripts de migración
3. Ajustar IDs si es necesario (Supabase usa UUIDs)

## 🔐 Autenticación

El sistema usa Supabase Auth. Los usuarios deben:

1. Crearse en Supabase Auth (Dashboard > Authentication > Users)
2. Crear registro correspondiente en la tabla `users` con el mismo UUID

Ejemplo de inserción de usuario:
```sql
INSERT INTO public.users (id, email, name, role)
VALUES (
  'uuid-del-usuario-en-auth',
  'usuario@example.com',
  'Nombre Usuario',
  'administración'
);
```

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── contexts/        # Contextos de React (Auth)
│   ├── lib/            # Configuración de Supabase
│   ├── pages/          # Páginas principales
│   ├── services/       # APIs y servicios
│   ├── utils/          # Utilidades
│   ├── App.jsx         # Componente principal
│   ├── main.jsx        # Punto de entrada
│   └── index.css       # Estilos globales
├── supabase/
│   ├── schema.sql      # Esquema de base de datos
│   ├── migration_helper.sql  # Funciones helper
│   └── migrate_articulos.sql # Datos de artículos
├── public/             # Archivos estáticos
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
- ✅ Almacenamiento de imágenes
- ✅ Filtros avanzados en todas las secciones
- ✅ Logo de Plot Center integrado

## 🔒 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso basadas en roles
- Autenticación mediante Supabase Auth
- Variables de entorno para credenciales

## 📝 Notas de Migración

### Cambios desde PHP/MySQL:

1. **IDs**: Cambiados de INT a UUID
2. **Timestamps**: Usa TIMESTAMPTZ en lugar de TIMESTAMP
3. **Enums**: Convertidos a CHECK constraints
4. **Sesiones**: Reemplazadas por Supabase Auth
5. **Archivos**: Migrados a Supabase Storage

### Funcionalidades Pendientes:

- [ ] Sistema de comentarios en pedidos
- [ ] Mensajería entre usuarios
- [ ] Notificaciones en tiempo real
- [ ] Exportación de reportes
- [ ] Integración completa de PlotAI en UI

## 🐛 Troubleshooting

### Error de conexión a Supabase
- Verificar variables de entorno
- Revisar que las políticas RLS estén correctas

### Error al subir imágenes
- Verificar que los buckets de Storage existan
- Revisar políticas de acceso de los buckets

### Error de autenticación
- Verificar que el usuario exista en Supabase Auth
- Verificar que exista registro en tabla `users`

## 📄 Licencia

Propietario - Stock Plot Center

## 👥 Soporte

Para soporte, contactar al equipo de desarrollo.

