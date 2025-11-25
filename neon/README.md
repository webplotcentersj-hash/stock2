# Migración a Neon PostgreSQL

Esta carpeta contiene los archivos necesarios para migrar la base de datos a Neon PostgreSQL.

## 📁 Archivos

- **`schema.sql`**: Esquema completo de la base de datos (tablas, índices, triggers)
- **`migrate_data.sql`**: Script de ejemplo para migrar datos
- **`MIGRATION_GUIDE.md`**: Guía detallada paso a paso
- **`create_admin_user.js`**: Script para crear usuario administrador inicial

## 🚀 Inicio Rápido

### 1. Ejecutar Schema

1. Ve a [Neon Dashboard](https://console.neon.tech)
2. Abre tu proyecto
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `schema.sql`
5. Ejecuta el script

### 2. Crear Usuario Administrador

```bash
# Instalar dependencias (si no las tienes)
npm install bcryptjs postgres

# Crear usuario admin
node neon/create_admin_user.js admin@plotcenter.com admin123 Administrador
```

O manualmente en SQL:

```sql
-- Primero genera el hash bcrypt de tu contraseña
-- Puedes usar: https://bcrypt-generator.com/

INSERT INTO users (email, password, name, role)
VALUES (
  'admin@plotcenter.com',
  '$2a$10$...', -- Hash bcrypt de tu contraseña
  'Administrador',
  'administración'
);
```

### 3. Migrar Datos

Sigue las instrucciones en `MIGRATION_GUIDE.md` para migrar tus datos existentes.

## 📝 Notas

- Los IDs ahora son UUIDs en lugar de INTs
- Las fechas usan TIMESTAMPTZ (con zona horaria)
- Los ENUMs se convirtieron a VARCHAR con CHECK constraints
- Todos los timestamps se actualizan automáticamente con triggers

## 🔗 Enlaces Útiles

- [Documentación de Neon](https://neon.tech/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Bcrypt Generator](https://bcrypt-generator.com/)

