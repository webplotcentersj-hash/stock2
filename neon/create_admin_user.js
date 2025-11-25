/**
 * Script para crear usuario administrador inicial
 * 
 * Uso:
 * 1. Instala dependencias: npm install bcryptjs postgres
 * 2. Configura DATABASE_URL en .env
 * 3. Ejecuta: node neon/create_admin_user.js
 */

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada en .env.local');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function createAdminUser() {
  try {
    const email = process.argv[2] || 'admin@plotcenter.com';
    const password = process.argv[3] || 'admin123';
    const name = process.argv[4] || 'Administrador';

    console.log('🔐 Creando usuario administrador...');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nombre: ${name}`);

    // Hash de la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Verificar si el usuario ya existe
    const existing = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existing.length > 0) {
      console.log('⚠️  El usuario ya existe. Actualizando contraseña...');
      await sql`
        UPDATE users 
        SET password = ${hashedPassword}, name = ${name}, role = 'administración'
        WHERE email = ${email}
      `;
      console.log('✅ Usuario actualizado exitosamente');
    } else {
      // Crear nuevo usuario
      const [user] = await sql`
        INSERT INTO users (email, password, name, role)
        VALUES (${email}, ${hashedPassword}, ${name}, 'administración')
        RETURNING id, email, name, role
      `;

      console.log('✅ Usuario creado exitosamente:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Rol: ${user.role}`);
    }

    console.log('\n📝 Credenciales de acceso:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createAdminUser();

