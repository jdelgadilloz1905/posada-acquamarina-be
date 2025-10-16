# Estructura del Proyecto - Hotel Acquamarina Backend

## 📁 Estructura de Directorios

```
posada-acquamarina-be/
│
├── src/                                    # Código fuente
│   ├── auth/                              # Módulo de Autenticación
│   │   ├── dto/
│   │   │   ├── login.dto.ts              # DTO para login
│   │   │   └── register.dto.ts           # DTO para registro
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts           # Estrategia JWT de Passport
│   │   ├── auth.controller.ts            # Controlador de autenticación
│   │   ├── auth.service.ts               # Lógica de autenticación
│   │   └── auth.module.ts                # Módulo de autenticación
│   │
│   ├── users/                             # Módulo de Usuarios
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts        # DTO para crear usuario
│   │   │   └── update-user.dto.ts        # DTO para actualizar usuario
│   │   ├── entities/
│   │   │   └── user.entity.ts            # Entidad User (tabla users)
│   │   ├── users.controller.ts           # Controlador CRUD de usuarios
│   │   ├── users.service.ts              # Lógica de negocio usuarios
│   │   └── users.module.ts               # Módulo de usuarios
│   │
│   ├── rooms/                             # Módulo de Habitaciones
│   │   ├── dto/
│   │   │   ├── create-room.dto.ts        # DTO para crear habitación
│   │   │   └── update-room.dto.ts        # DTO para actualizar habitación
│   │   ├── entities/
│   │   │   └── room.entity.ts            # Entidad Room (tabla rooms)
│   │   ├── rooms.controller.ts           # Controlador CRUD de habitaciones
│   │   ├── rooms.service.ts              # Lógica de habitaciones
│   │   └── rooms.module.ts               # Módulo de habitaciones
│   │
│   ├── reservations/                      # Módulo de Reservas
│   │   ├── dto/
│   │   │   ├── create-reservation.dto.ts # DTO para crear reserva
│   │   │   └── update-reservation.dto.ts # DTO para actualizar reserva
│   │   ├── entities/
│   │   │   └── reservation.entity.ts     # Entidad Reservation (tabla reservations)
│   │   ├── reservations.controller.ts    # Controlador CRUD de reservas
│   │   ├── reservations.service.ts       # Lógica de reservas
│   │   └── reservations.module.ts        # Módulo de reservas
│   │
│   ├── common/                            # Utilidades compartidas
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts         # Guard para proteger rutas con JWT
│   │   └── decorators/
│   │       └── get-user.decorator.ts     # Decorador para obtener usuario actual
│   │
│   ├── app.module.ts                      # Módulo raíz de la aplicación
│   └── main.ts                            # Punto de entrada de la aplicación
│
├── dist/                                   # Archivos compilados (generado)
├── node_modules/                          # Dependencias (generado)
│
├── .env                                   # Variables de entorno (NO versionar)
├── .gitignore                             # Archivos ignorados por Git
├── nest-cli.json                          # Configuración de NestJS CLI
├── package.json                           # Dependencias y scripts
├── tsconfig.json                          # Configuración de TypeScript
│
├── README.md                              # Documentación principal
├── SETUP.md                               # Guía de configuración inicial
├── ESTRUCTURA.md                          # Este archivo
└── api-examples.http                      # Ejemplos de peticiones HTTP
```

## 🗄️ Esquema de Base de Datos

### Tabla: `users`
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, HASHED)
- fullName (VARCHAR)
- phone (VARCHAR)
- role (ENUM: 'admin', 'user')
- isActive (BOOLEAN)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Tabla: `rooms`
```sql
- id (UUID, PK)
- roomNumber (VARCHAR, UNIQUE)
- type (ENUM: 'single', 'double', 'suite', 'family')
- pricePerNight (DECIMAL)
- capacity (INTEGER)
- maxChildren (INTEGER)
- description (TEXT)
- amenities (ARRAY)
- status (ENUM: 'available', 'occupied', 'maintenance')
- images (ARRAY)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

### Tabla: `reservations`
```sql
- id (UUID, PK)
- checkInDate (DATE)
- checkOutDate (DATE)
- numberOfAdults (INTEGER)
- numberOfChildren (INTEGER)
- guestName (VARCHAR)
- guestEmail (VARCHAR)
- guestPhone (VARCHAR)
- specialRequests (TEXT)
- totalPrice (DECIMAL)
- status (ENUM: 'pending', 'confirmed', 'cancelled', 'completed')
- userId (UUID, FK -> users.id, NULLABLE)
- roomId (UUID, FK -> rooms.id)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

## 🔄 Relaciones

```
User (1) ----< (N) Reservation
Room (1) ----< (N) Reservation
```

- Un usuario puede tener múltiples reservas
- Una habitación puede tener múltiples reservas (en diferentes fechas)
- Una reserva pertenece a un usuario (opcional) y una habitación

## 🔐 Flujo de Autenticación

```
1. Usuario se registra → POST /auth/register
   ↓
2. Sistema hashea contraseña y guarda usuario
   ↓
3. Usuario hace login → POST /auth/login
   ↓
4. Sistema valida credenciales
   ↓
5. Sistema genera token JWT
   ↓
6. Cliente guarda token
   ↓
7. Cliente envía token en header "Authorization: Bearer {token}"
   ↓
8. JwtAuthGuard valida token en rutas protegidas
```

## 🎯 Flujo de Reserva

```
1. Cliente consulta habitaciones disponibles
   GET /rooms o GET /rooms/available?checkIn=...&checkOut=...
   ↓
2. Cliente selecciona habitación
   ↓
3. Cliente crea reserva → POST /reservations
   ↓
4. Sistema valida:
   - Fechas válidas (check-out > check-in, no en el pasado)
   - Habitación existe
   - Habitación disponible para esas fechas
   ↓
5. Sistema calcula precio total automáticamente
   (días × pricePerNight)
   ↓
6. Sistema crea reserva con status "pending"
   ↓
7. Admin puede confirmar → PATCH /reservations/:id/confirm
   ↓
8. Cliente puede cancelar → PATCH /reservations/:id/cancel
```

## 📊 Casos de Uso Principales

### Usuario No Autenticado
- ✅ Registrarse
- ✅ Iniciar sesión
- ✅ Ver habitaciones disponibles
- ✅ Crear reserva (con datos de huésped)
- ✅ Ver una reserva específica (si tiene el ID)

### Usuario Autenticado (Cliente)
- ✅ Todo lo anterior
- ✅ Ver su perfil
- ✅ Ver sus propias reservas
- ✅ Actualizar sus reservas
- ✅ Cancelar sus reservas

### Usuario Admin
- ✅ Todo lo anterior
- ✅ Ver todas las reservas de todos los clientes
- ✅ Gestionar habitaciones (CRUD completo)
- ✅ Gestionar usuarios (CRUD completo)
- ✅ Confirmar/cancelar cualquier reserva
- ✅ Ver estadísticas (puede implementarse)

## 🛡️ Protección de Rutas

### Rutas Públicas (sin autenticación)
- `POST /auth/register`
- `POST /auth/login`
- `GET /rooms`
- `GET /rooms/available`
- `GET /rooms/:id`
- `POST /reservations`
- `GET /reservations/:id`

### Rutas Protegidas (requieren JWT)
- `GET /auth/me`
- `GET /reservations` (filtra según rol)
- `GET /reservations/my-reservations`
- `PATCH /reservations/:id`
- `PATCH /reservations/:id/confirm`
- `PATCH /reservations/:id/cancel`
- `DELETE /reservations/:id`
- `POST /rooms`
- `PATCH /rooms/:id`
- `DELETE /rooms/:id`
- Todos los endpoints de `/users`

## 🔧 Variables de Entorno Requeridas

```env
DB_HOST          # Host de PostgreSQL
DB_PORT          # Puerto de PostgreSQL (5432)
DB_USERNAME      # Usuario de la BD
DB_PASSWORD      # Contraseña de la BD
DB_DATABASE      # Nombre de la BD
JWT_SECRET       # Clave secreta para JWT
JWT_EXPIRATION   # Tiempo de expiración del token
PORT             # Puerto del servidor (3000)
NODE_ENV         # Entorno (development/production)
FRONTEND_URL     # URL del frontend para CORS
```

## 📦 Dependencias Principales

- **@nestjs/core**: Framework principal
- **@nestjs/typeorm**: Integración con TypeORM
- **@nestjs/jwt**: Manejo de JWT
- **@nestjs/passport**: Autenticación con Passport
- **typeorm**: ORM para PostgreSQL
- **pg**: Driver de PostgreSQL
- **bcrypt**: Hash de contraseñas
- **class-validator**: Validación de DTOs
- **class-transformer**: Transformación de objetos

## 🚀 Comandos Útiles

```bash
# Desarrollo
npm run start:dev          # Inicia servidor en modo watch

# Producción
npm run build              # Compila el proyecto
npm run start:prod         # Inicia servidor en producción

# Base de datos
# TypeORM sincroniza automáticamente en desarrollo
# Las tablas se crean al iniciar el servidor

# Otros
npm run lint               # Revisar código
npm run test               # Ejecutar tests
```

## 📈 Próximas Mejoras Sugeridas

1. **Sistema de Pagos**: Integrar Stripe/PayPal
2. **Emails**: Enviar confirmaciones por email
3. **Imágenes**: Sistema de upload de imágenes
4. **Reportes**: Dashboard con estadísticas
5. **Reviews**: Sistema de reseñas de huéspedes
6. **Notificaciones**: Push notifications
7. **Multi-idioma**: i18n support
8. **Tests**: Tests unitarios y e2e
9. **Documentación API**: Swagger/OpenAPI
10. **Rate Limiting**: Protección contra abuso
