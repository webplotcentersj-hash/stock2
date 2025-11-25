# Guía de Migración: MySQL → Neon PostgreSQL

Esta guía te ayudará a migrar tu base de datos MySQL a Neon PostgreSQL.

## 📋 Pasos para Migrar

### Paso 1: Crear Proyecto en Neon

1. Ve a [https://neon.tech](https://neon.tech)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Copia la **Connection String** (DATABASE_URL)

### Paso 2: Ejecutar el Schema

1. En el Dashboard de Neon, ve a **SQL Editor**
2. Abre el archivo `neon/schema.sql`
3. Copia y pega todo el contenido en el SQL Editor
4. Ejecuta el script (botón "Run" o F5)

Esto creará todas las tablas, índices y triggers necesarios.

### Paso 3: Migrar Datos

Tienes varias opciones:

#### Opción A: Migración Manual (Recomendado para empezar)

1. **Exportar desde MySQL:**
   ```bash
   # En tu servidor MySQL
   mysqldump -u usuario -p u956355532_sto articulos > articulos.sql
   ```

2. **Convertir a CSV:**
   - Abre el SQL exportado
   - Extrae solo los INSERT statements
   - Conviértelos a CSV o ajusta manualmente

3. **Importar a Neon:**
   - Usa el SQL Editor de Neon
   - Ajusta los INSERT statements para usar UUIDs
   - Ejecuta los INSERTs

#### Opción B: Usar Script de Migración

1. Exporta tus datos desde MySQL a CSV
2. Ajusta el script `neon/migrate_data.sql`
3. Ejecuta en Neon SQL Editor

#### Opción C: Migración Automática (Avanzado)

Puedes usar herramientas como:
- [pgloader](https://pgloader.readthedocs.io/)
- [AWS DMS](https://aws.amazon.com/dms/)
- Scripts personalizados en Python/Node.js

### Paso 4: Crear Usuario Inicial

Necesitas crear al menos un usuario para poder iniciar sesión.

#### Generar Hash de Contraseña

En Node.js:
```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('tu_contraseña', 10);
console.log(hash);
```

O usa esta herramienta online: https://bcrypt-generator.com/

#### Insertar Usuario

```sql
INSERT INTO users (id, email, password, name, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@plotcenter.com',
    '$2a$10$...', -- Hash bcrypt de tu contraseña
    'Administrador',
    'administración',
    NOW(),
    NOW()
);
```

### Paso 5: Verificar Migración

Ejecuta estas queries para verificar:

```sql
-- Verificar tablas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Contar registros
SELECT 
    'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'articulos', COUNT(*) FROM articulos
UNION ALL
SELECT 'pedidos', COUNT(*) FROM pedidos;

-- Verificar estructura de una tabla
\d articulos
```

## 🔄 Mapeo de Tipos de Datos

| MySQL | PostgreSQL |
|-------|------------|
| `INT` | `INTEGER` |
| `VARCHAR(n)` | `VARCHAR(n)` |
| `TEXT` | `TEXT` |
| `DECIMAL(10,2)` | `DECIMAL(10,2)` |
| `TIMESTAMP` | `TIMESTAMPTZ` |
| `ENUM` | `VARCHAR` con CHECK constraint |
| `AUTO_INCREMENT` | `SERIAL` o `UUID` |

## ⚠️ Diferencias Importantes

1. **IDs**: MySQL usa INT auto-increment, PostgreSQL usa UUIDs
   - Necesitarás mapear los IDs o generar nuevos

2. **Timestamps**: MySQL usa TIMESTAMP, PostgreSQL usa TIMESTAMPTZ
   - Los valores se convierten automáticamente

3. **ENUMs**: MySQL tiene ENUM nativo, PostgreSQL usa VARCHAR con CHECK
   - Ya está manejado en el schema

4. **Auto-increment**: PostgreSQL usa SERIAL o UUID
   - El schema usa UUIDs para mejor distribución

## 🛠️ Herramientas Útiles

- **Neon SQL Editor**: Editor SQL integrado en Neon
- **pgAdmin**: Cliente gráfico para PostgreSQL
- **DBeaver**: Cliente universal de bases de datos
- **psql**: Cliente de línea de comandos

## 📝 Checklist de Migración

- [ ] Proyecto creado en Neon
- [ ] Schema ejecutado (`schema.sql`)
- [ ] Datos de usuarios migrados (al menos 1 usuario)
- [ ] Datos de artículos migrados
- [ ] Datos de pedidos migrados (si existen)
- [ ] Datos de órdenes de compra migrados (si existen)
- [ ] Datos de movimientos de caja migrados (si existen)
- [ ] Verificación de datos completada
- [ ] Variables de entorno configuradas
- [ ] Prueba de conexión desde la aplicación

## 🆘 Problemas Comunes

### Error: "relation already exists"
- Las tablas ya existen, elimínalas primero o usa `DROP TABLE IF EXISTS`

### Error: "extension uuid-ossp does not exist"
- Ejecuta: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Error de conexión
- Verifica que DATABASE_URL incluya `?sslmode=require`
- Verifica que el proyecto Neon esté activo

### IDs no coinciden
- Los UUIDs son diferentes a los INTs de MySQL
- Necesitarás actualizar las foreign keys manualmente o usar un mapeo

## 📞 Soporte

Si tienes problemas con la migración:
1. Revisa los logs en Neon Dashboard
2. Verifica la sintaxis SQL en el editor
3. Consulta la documentación de Neon: https://neon.tech/docs

