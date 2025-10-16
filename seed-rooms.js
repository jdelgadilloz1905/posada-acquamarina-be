// Script para insertar las 3 habitaciones del Hotel Acquamarina
// Ejecutar con: node seed-rooms.js

const rooms = [
  // Habitación 1: Saky Saky (Estándar)
  {
    name: 'Saky Saky',
    roomNumber: '101',
    type: 'single',
    pricePerNight: 520,
    capacity: 2,
    maxChildren: 0,
    description: 'Nuestra habitación estándar. Espaciosas habitaciones equipadas con una cama Queen size ideales para parejas que buscan comfort y descanso. Máximo 2 personas.',
    amenities: [
      'Aire acondicionado',
      'Smart TV',
      'Caja fuerte',
      'Almohadas y edredones de plumón de fabricación italiana'
    ],
    status: 'available',
    videoId: 'drLVfiBl1sg'
  },
  // Habitación 2: Noronky (Cuádruple)
  {
    name: 'Noronky',
    roomNumber: '201',
    type: 'quad',
    pricePerNight: 720,
    capacity: 4,
    maxChildren: 2,
    description: 'Habitación cuádruple amplia con dos camas Queen size. Perfecta para familias o grupos que buscan espacio y comodidad en un ambiente elegante.',
    amenities: [
      'Aire acondicionado',
      'Smart TV',
      'Caja fuerte',
      'Almohadas y edredones de plumón de fabricación italiana'
    ],
    status: 'available',
    videoId: 'zjeCnz67CpU'
  },
  // Habitación 3: Francisky (Familiar)
  {
    name: 'Francisky',
    roomNumber: '301',
    type: 'family',
    pricePerNight: 980,
    capacity: 6,
    maxChildren: 3,
    description: 'Nuestra habitación familiar más espaciosa. Ideal para familias grandes con múltiples espacios de descanso y áreas comunes. Incluye 1 Cama King + 2 Sofá Cama.',
    amenities: [
      'Aire acondicionado',
      'Smart TV',
      'Caja fuerte',
      'Almohadas y edredones de plumón de fabricación italiana'
    ],
    status: 'available',
    videoId: 'EZ6tsYaqBYk'
  }
];

async function seedRooms() {
  const API_URL = 'http://localhost:3000';

  console.log('🏨 Insertando habitaciones del Hotel Acquamarina...\n');

  try {
    // 1. Primero necesitamos hacer login para obtener el token
    console.log('1️⃣  Creando usuario admin...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@acquamarina.com',
        password: 'Admin123!',
        fullName: 'Administrador Hotel',
        phone: '+123456789',
        role: 'admin'
      })
    });

    let token;
    if (registerResponse.status === 409 || registerResponse.status === 400) {
      // El usuario ya existe, hacer login
      console.log('   Usuario admin ya existe, haciendo login...');
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@acquamarina.com',
          password: 'Admin123!'
        })
      });

      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(`Error en login: ${JSON.stringify(errorData)}`);
      }

      const loginData = await loginResponse.json();
      token = loginData.access_token;
    } else if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      token = registerData.access_token;
    } else {
      const errorData = await registerResponse.json();
      throw new Error(`Error en registro: ${JSON.stringify(errorData)}`);
    }

    if (!token) {
      throw new Error('No se pudo obtener el token de autenticación');
    }

    console.log('   ✅ Token obtenido');
    console.log(`   📝 Token: ${token.substring(0, 20)}...`);
    console.log('');

    // 2. Insertar cada habitación
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      console.log(`${i + 1}️⃣  Insertando habitación ${room.roomNumber}...`);

      try {
        const response = await fetch(`${API_URL}/rooms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(room)
        });

        if (response.ok) {
          const createdRoom = await response.json();
          console.log(`   ✅ Habitación ${room.roomNumber} creada exitosamente`);
          console.log(`      ID: ${createdRoom.id}`);
          console.log(`      Precio: $${room.pricePerNight} / Capacidad: ${room.capacity} personas\n`);
          successCount++;
        } else {
          const error = await response.json();
          console.log(`   ❌ Error HTTP ${response.status}: ${error.message || JSON.stringify(error)}`);
          console.log(`      URL: ${API_URL}/rooms`);
          console.log(`      Verificar que el token sea válido y el usuario sea admin\n`);
          errorCount++;
        }
      } catch (error) {
        console.log(`   ❌ Error de conexión: ${error.message}\n`);
        errorCount++;
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log(`✨ Proceso completado: ${successCount} exitosas, ${errorCount} errores\n`);

    if (successCount > 0) {
      console.log('📚 Puedes ver las habitaciones en:');
      console.log('   - Swagger: http://localhost:3000/api');
      console.log('   - Endpoint: GET http://localhost:3000/rooms');
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Si hubo errores "Unauthorized":');
      console.log('   1. Verifica que el servidor esté corriendo (npm run start:dev)');
      console.log('   2. Alternativamente, usa Swagger (ver archivo PASOS_RAPIDOS.txt)');
    }

  } catch (error) {
    console.error('\n❌ Error general:', error.message);
    console.log('\n⚠️  Soluciones:');
    console.log('   1. Asegúrate de que el servidor esté corriendo:');
    console.log('      npm run start:dev');
    console.log('   2. Verifica que Docker esté activo:');
    console.log('      docker-compose ps');
    console.log('   3. Si persisten los errores, usa Swagger (más fácil):');
    console.log('      Ver archivo: PASOS_RAPIDOS.txt');
  }
}

// Ejecutar el script
seedRooms();
