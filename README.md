# Hotel Acquamarina - Backend API

Backend de reservas para el Hotel Acquamarina desarrollado con NestJS, TypeORM y PostgreSQL.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ Gestión de usuarios (admins y clientes)
- ✅ CRUD completo de habitaciones
- ✅ Sistema de reservas con validación de disponibilidad
- ✅ Cálculo automático de precios
- ✅ Validación de datos con class-validator
- ✅ Relaciones de base de datos con TypeORM
- ✅ CORS habilitado para frontend
- ✅ **Documentación Swagger/OpenAPI interactiva** 📚

## 📋 Requisitos Previos

- Node.js >= 16.x
- **Docker Desktop** (Recomendado) ó PostgreSQL >= 12.x
- npm o yarn

## 🔧 Instalación

### Opción A: Con Docker (Recomendado para Windows) 🐳

**Más fácil y rápido - No necesitas instalar PostgreSQL**

1. Asegúrate de tener **Docker Desktop** corriendo

2. Instalar dependencias:
```bash
npm install
```

3. **¡Listo!** Ejecuta:
```bash
start-dev.bat
```

Este script inicia PostgreSQL en Docker y el servidor NestJS automáticamente.

**Comandos útiles:**
- `docker-start.bat` - Solo iniciar PostgreSQL
- `docker-stop.bat` - Detener PostgreSQL
- Ver documentación completa en [DOCKER.md](DOCKER.md)

---

### Opción B: Con PostgreSQL Local

1. Instalar dependencias:
```bash
npm install
```

2. Crear la base de datos:
```sql
CREATE DATABASE hotel_acquamarina;
```

3. Configurar variables de entorno en el archivo `.env`:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=tu_password
DB_DATABASE=hotel_acquamarina

# JWT Configuration
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
JWT_EXPIRATION=7d

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

4. Crear la base de datos en PostgreSQL:
```sql
CREATE DATABASE hotel_acquamarina;
```

5. Ejecutar el servidor en modo desarrollo:
```bash
npm run start:dev
```

El servidor estará corriendo en `http://localhost:3000`

## 📚 Swagger/OpenAPI - Documentación Interactiva

Una vez que el servidor esté corriendo, abre tu navegador en:

```
http://localhost:3000/api
```

Aquí podrás:
- ✅ Ver todos los endpoints organizados por categorías
- ✅ Probar cada endpoint directamente desde el navegador
- ✅ Autenticarte con JWT (botón "Authorize")
- ✅ Ver ejemplos y esquemas de request/response
- ✅ Exportar la especificación OpenAPI

**Ver guía completa:** [SWAGGER.md](SWAGGER.md)

## 📚 Estructura del Proyecto

```
src/
├── auth/                    # Módulo de autenticación
│   ├── dto/                # DTOs de login y registro
│   ├── strategies/         # Estrategia JWT
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/                  # Módulo de usuarios
│   ├── dto/
│   ├── entities/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── rooms/                  # Módulo de habitaciones
│   ├── dto/
│   ├── entities/
│   ├── rooms.controller.ts
│   ├── rooms.service.ts
│   └── rooms.module.ts
├── reservations/          # Módulo de reservas
│   ├── dto/
│   ├── entities/
│   ├── reservations.controller.ts
│   ├── reservations.service.ts
│   └── reservations.module.ts
├── common/                # Utilidades comunes
│   ├── guards/           # Guards de autenticación
│   └── decorators/       # Decoradores personalizados
├── app.module.ts
└── main.ts
```

## 🔐 API Endpoints

### Autenticación

#### Registro de usuario
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Obtener perfil del usuario autenticado
```http
GET /auth/me
Authorization: Bearer {token}
```

### Habitaciones

#### Listar todas las habitaciones
```http
GET /rooms
```

#### Obtener habitaciones disponibles
```http
GET /rooms/available?checkIn=2025-01-15&checkOut=2025-01-20
```

#### Obtener una habitación por ID
```http
GET /rooms/:id
```

#### Crear habitación (requiere autenticación)
```http
POST /rooms
Authorization: Bearer {token}
Content-Type: application/json

{
  "roomNumber": "101",
  "type": "double",
  "pricePerNight": 150.00,
  "capacity": 2,
  "maxChildren": 1,
  "description": "Habitación doble con vista al mar",
  "amenities": ["WiFi", "TV", "Aire acondicionado", "Mini bar"],
  "status": "available",
  "images": ["url1.jpg", "url2.jpg"]
}
```

#### Actualizar habitación (requiere autenticación)
```http
PATCH /rooms/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "pricePerNight": 175.00,
  "status": "maintenance"
}
```

#### Eliminar habitación (requiere autenticación)
```http
DELETE /rooms/:id
Authorization: Bearer {token}
```

### Reservas

#### Crear reserva
```http
POST /reservations
Content-Type: application/json

{
  "checkInDate": "2025-01-15",
  "checkOutDate": "2025-01-20",
  "numberOfAdults": 2,
  "numberOfChildren": 1,
  "guestName": "John Doe",
  "guestEmail": "john@example.com",
  "guestPhone": "+1234567890",
  "specialRequests": "Cama extra para niño",
  "roomId": "uuid-de-la-habitacion",
  "userId": "uuid-del-usuario" // opcional
}
```

#### Listar reservas (requiere autenticación)
```http
GET /reservations
Authorization: Bearer {token}
```
- Si el usuario es admin: retorna todas las reservas
- Si es usuario normal: retorna solo sus reservas

#### Mis reservas (requiere autenticación)
```http
GET /reservations/my-reservations
Authorization: Bearer {token}
```

#### Obtener una reserva por ID
```http
GET /reservations/:id
```

#### Actualizar reserva (requiere autenticación)
```http
PATCH /reservations/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "confirmed",
  "specialRequests": "Solicitud actualizada"
}
```

#### Confirmar reserva (requiere autenticación)
```http
PATCH /reservations/:id/confirm
Authorization: Bearer {token}
```

#### Cancelar reserva (requiere autenticación)
```http
PATCH /reservations/:id/cancel
Authorization: Bearer {token}
```

#### Eliminar reserva (requiere autenticación)
```http
DELETE /reservations/:id
Authorization: Bearer {token}
```

### Usuarios (requiere autenticación)

#### Listar todos los usuarios
```http
GET /users
Authorization: Bearer {token}
```

#### Obtener un usuario por ID
```http
GET /users/:id
Authorization: Bearer {token}
```

#### Crear usuario
```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "role": "user" // "user" o "admin"
}
```

#### Actualizar usuario
```http
PATCH /users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "fullName": "John Updated",
  "phone": "+9876543210"
}
```

#### Eliminar usuario
```http
DELETE /users/:id
Authorization: Bearer {token}
```

## 📊 Modelos de Datos

### User (Usuario)
```typescript
{
  id: string (UUID)
  email: string (unique)
  password: string (hashed)
  fullName: string
  phone: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Room (Habitación)
```typescript
{
  id: string (UUID)
  roomNumber: string (unique)
  type: 'single' | 'double' | 'suite' | 'family'
  pricePerNight: number
  capacity: number
  maxChildren: number
  description: string
  amenities: string[]
  status: 'available' | 'occupied' | 'maintenance'
  images: string[]
  createdAt: Date
  updatedAt: Date
}
```

### Reservation (Reserva)
```typescript
{
  id: string (UUID)
  checkInDate: Date
  checkOutDate: Date
  numberOfAdults: number
  numberOfChildren: number
  guestName: string
  guestEmail: string
  guestPhone: string
  specialRequests: string
  totalPrice: number (calculado automáticamente)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  userId: string (FK - opcional)
  roomId: string (FK)
  createdAt: Date
  updatedAt: Date
}
```

## 🛠️ Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Compilar proyecto
npm run build

# Producción
npm run start:prod

# Tests
npm run test
npm run test:watch
npm run test:cov
```

## 🔒 Seguridad

- Las contraseñas se hashean con bcrypt (10 rounds)
- Autenticación basada en JWT
- Validación de datos en todas las entradas
- CORS configurado para el frontend especificado
- Variables sensibles en archivo .env (no versionado)

## 📝 Notas Importantes

1. **Base de datos**: Asegúrate de que PostgreSQL esté corriendo antes de iniciar el servidor
2. **Sincronización automática**: En desarrollo, TypeORM está configurado para sincronizar automáticamente el esquema (synchronize: true). **DESACTIVAR en producción**
3. **CORS**: El frontend debe estar en la URL especificada en `FRONTEND_URL` del .env
4. **JWT Secret**: Cambiar `JWT_SECRET` en producción por una clave segura

## 🚀 Próximos Pasos

1. Crear usuario administrador inicial
2. Agregar habitaciones al sistema
3. Configurar el frontend para consumir esta API
4. (Opcional) Agregar sistema de pagos
5. (Opcional) Agregar envío de emails de confirmación
6. (Opcional) Agregar subida de imágenes

## 📞 Contacto

Para dudas o consultas sobre el proyecto, contactar al equipo de desarrollo.
