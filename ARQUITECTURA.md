# Arquitectura del Sistema - Hotel Acquamarina

## 🏗️ Diagrama de Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│               (React/Vue/Angular/HTML)                           │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Login   │  │  Rooms   │  │Reservation│  │  Admin  │        │
│  │   Page   │  │   List   │  │   Form    │  │  Panel  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                   │
│           ▼         ▼            ▼              ▼                │
│      ┌──────────────────────────────────────────────┐           │
│      │         API Services (Axios/Fetch)           │           │
│      └──────────────────────────────────────────────┘           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │ JSON
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                       BACKEND API                                │
│                     (NestJS + Express)                           │
│                      PORT: 3000                                  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   CORS   │  │Validation│  │   JWT    │  │  Error   │  │  │
│  │  │          │  │   Pipe   │  │  Guard   │  │ Handling │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Controller Layer                        │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │    Auth    │  │   Rooms    │  │   Reservations     │  │  │
│  │  │ Controller │  │ Controller │  │    Controller      │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  │  ┌────────────┐                                           │  │
│  │  │   Users    │                                           │  │
│  │  │ Controller │                                           │  │
│  │  └────────────┘                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                    Service Layer                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │    Auth    │  │   Rooms    │  │   Reservations     │  │  │
│  │  │  Service   │  │  Service   │  │     Service        │  │  │
│  │  │            │  │            │  │                    │  │  │
│  │  │ - Login    │  │ - CRUD     │  │ - Create          │  │  │
│  │  │ - Register │  │ - Search   │  │ - Validate Dates  │  │  │
│  │  │ - JWT Gen  │  │ - Filter   │  │ - Check Available │  │  │
│  │  └────────────┘  └────────────┘  │ - Calc Price      │  │  │
│  │  ┌────────────┐                  └────────────────────┘  │  │
│  │  │   Users    │                                           │  │
│  │  │  Service   │                                           │  │
│  │  │            │                                           │  │
│  │  │ - CRUD     │                                           │  │
│  │  │ - Hash Pwd │                                           │  │
│  │  └────────────┘                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────────────────┐  │
│  │                 Repository Layer (TypeORM)                 │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │  │
│  │  │   User     │  │    Room    │  │   Reservation      │  │  │
│  │  │ Repository │  │ Repository │  │   Repository       │  │  │
│  │  └────────────┘  └────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           │ SQL Queries
                           │
┌──────────────────────────▼───────────────────────────────────────┐
│                      PostgreSQL Database                          │
│                       PORT: 5432                                  │
│                                                                   │
│  ┌────────────┐     ┌────────────┐     ┌────────────────────┐   │
│  │   users    │     │   rooms    │     │   reservations     │   │
│  │            │     │            │     │                    │   │
│  │ - id       │     │ - id       │     │ - id              │   │
│  │ - email    │     │ - number   │     │ - checkIn         │   │
│  │ - password │     │ - type     │     │ - checkOut        │   │
│  │ - name     │     │ - price    │     │ - guestName       │   │
│  │ - role     │     │ - capacity │     │ - guestEmail      │   │
│  │ - ...      │     │ - ...      │     │ - roomId (FK)     │   │
│  └────────────┘     └────────────┘     │ - userId (FK)     │   │
│        │                   │            │ - ...             │   │
│        │                   │            └────────────────────┘   │
│        │                   │                    │                │
│        └───────────────────┴────────────────────┘                │
│                    (Relaciones)                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos: Crear Reserva

```
1. FRONTEND
   │
   │ Usuario llena formulario de reserva
   │ - Fechas de entrada/salida
   │ - Número de huéspedes
   │ - Información personal
   │
   ▼
   POST /reservations
   Body: { checkInDate, checkOutDate, roomId, ... }
   │
   ▼

2. BACKEND - Controller
   │
   │ ReservationsController.create()
   │ - Recibe DTO
   │ - Valida estructura (class-validator)
   │
   ▼

3. BACKEND - Service
   │
   │ ReservationsService.create()
   │ ┌─────────────────────────────┐
   │ │ 1. Validar fechas           │
   │ │    - checkOut > checkIn     │
   │ │    - No en el pasado        │
   │ │                             │
   │ │ 2. Verificar habitación     │
   │ │    - Existe?                │
   │ │    - Estado?                │
   │ │                             │
   │ │ 3. Verificar disponibilidad │
   │ │    - Query a reservas       │
   │ │    - Buscar conflictos      │
   │ │                             │
   │ │ 4. Calcular precio          │
   │ │    - nights = dates diff    │
   │ │    - total = nights * price │
   │ │                             │
   │ │ 5. Crear reserva            │
   │ │    - status = "pending"     │
   │ └─────────────────────────────┘
   │
   ▼

4. BACKEND - Repository
   │
   │ TypeORM Repository.save()
   │ - Genera SQL INSERT
   │
   ▼

5. DATABASE
   │
   │ PostgreSQL
   │ - Inserta registro en tabla "reservations"
   │ - Retorna registro con ID generado
   │
   ▼

6. RESPUESTA
   │
   │ { id, checkIn, checkOut, totalPrice, status, ... }
   │
   ▼

7. FRONTEND
   │
   │ Muestra confirmación al usuario
   │ "¡Reserva creada exitosamente!"
```

## 🔐 Flujo de Autenticación JWT

```
1. REGISTRO/LOGIN
   │
   │ Usuario ingresa email y password
   │
   ▼
   POST /auth/login
   Body: { email, password }
   │
   ▼

2. AuthService.login()
   │
   ├─► Buscar usuario por email
   │
   ├─► Verificar password (bcrypt.compare)
   │
   ├─► Verificar usuario activo
   │
   └─► Generar token JWT
       │
       JwtService.sign({ sub: userId, email, role })
       │
       ▼
       Token: "eyJhbGciOiJIUzI1NI..."
   │
   ▼

3. RESPUESTA
   │
   │ {
   │   access_token: "eyJhbGciOi...",
   │   user: { id, email, fullName, role }
   │ }
   │
   ▼

4. FRONTEND
   │
   │ Guarda token en localStorage
   │ localStorage.setItem('access_token', token)
   │
   ▼

5. PETICIONES FUTURAS
   │
   │ Frontend incluye en header:
   │ Authorization: Bearer eyJhbGciOi...
   │
   ▼

6. JwtAuthGuard
   │
   ├─► Extrae token del header
   │
   ├─► Verifica firma del token
   │
   ├─► Decodifica payload
   │
   └─► Busca usuario en BD
       │
       ▼
       Inyecta user en request
   │
   ▼

7. Controller
   │
   │ Accede al usuario con @GetUser()
   │ Procesa petición
```

## 🗂️ Capas de la Aplicación

### 1. **Controller Layer** (Entrada HTTP)
- **Responsabilidad**: Recibir peticiones HTTP, validar entrada, llamar servicios
- **Archivos**: `*.controller.ts`
- **Ejemplo**:
  ```typescript
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.service.create(dto);
  }
  ```

### 2. **Service Layer** (Lógica de Negocio)
- **Responsabilidad**: Procesar datos, aplicar reglas de negocio, coordinar repositorios
- **Archivos**: `*.service.ts`
- **Ejemplo**:
  ```typescript
  async create(dto: CreateReservationDto) {
    // Validar disponibilidad
    // Calcular precio
    // Guardar en BD
    return this.repository.save(reservation);
  }
  ```

### 3. **Repository Layer** (Acceso a Datos)
- **Responsabilidad**: Interactuar con la base de datos
- **Archivos**: TypeORM Repositories (inyectados)
- **Ejemplo**:
  ```typescript
  this.repository.find({ where: { userId } })
  this.repository.save(entity)
  ```

### 4. **Entity Layer** (Modelos de Datos)
- **Responsabilidad**: Definir estructura de tablas y relaciones
- **Archivos**: `*.entity.ts`
- **Ejemplo**:
  ```typescript
  @Entity('reservations')
  class Reservation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Room)
    room: Room;
  }
  ```

### 5. **DTO Layer** (Transferencia de Datos)
- **Responsabilidad**: Validar datos de entrada/salida
- **Archivos**: `dto/*.dto.ts`
- **Ejemplo**:
  ```typescript
  class CreateReservationDto {
    @IsDateString()
    checkInDate: string;

    @IsEmail()
    guestEmail: string;
  }
  ```

## 🛡️ Seguridad Implementada

```
┌─────────────────────────────────────────────────────────────┐
│                    Medidas de Seguridad                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Autenticación JWT                                        │
│     - Tokens firmados con clave secreta                     │
│     - Expiración configurable (7 días)                      │
│     - Validación en cada petición protegida                 │
│                                                              │
│  2. Hash de Contraseñas                                      │
│     - Bcrypt con 10 rounds                                  │
│     - Nunca se almacenan en texto plano                     │
│     - Comparación segura en login                           │
│                                                              │
│  3. Validación de Datos                                      │
│     - Class-validator en todos los DTOs                     │
│     - Whitelist (elimina campos extra)                      │
│     - ForbidNonWhitelisted (rechaza campos desconocidos)    │
│                                                              │
│  4. Protección de Rutas                                      │
│     - JwtAuthGuard en endpoints protegidos                  │
│     - Verificación de roles (admin/user)                    │
│     - Filtrado de datos según permisos                      │
│                                                              │
│  5. CORS                                                     │
│     - Whitelist de orígenes permitidos                      │
│     - Configurado en FRONTEND_URL                           │
│                                                              │
│  6. TypeORM Protection                                       │
│     - Prepared statements (previene SQL injection)          │
│     - Validación de tipos                                   │
│                                                              │
│  7. Variables de Entorno                                     │
│     - Credenciales en .env (no versionado)                  │
│     - .gitignore configurado                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Diagrama Entidad-Relación

```
┌─────────────────────┐           ┌─────────────────────┐
│       User          │           │        Room         │
├─────────────────────┤           ├─────────────────────┤
│ id (PK)             │           │ id (PK)             │
│ email (UNIQUE)      │           │ roomNumber (UNIQUE) │
│ password (HASHED)   │           │ type                │
│ fullName            │           │ pricePerNight       │
│ phone               │           │ capacity            │
│ role (ENUM)         │           │ maxChildren         │
│ isActive            │           │ description         │
│ createdAt           │           │ amenities (ARRAY)   │
│ updatedAt           │           │ status (ENUM)       │
└──────────┬──────────┘           │ images (ARRAY)      │
           │                      │ createdAt           │
           │                      │ updatedAt           │
           │                      └──────────┬──────────┘
           │                                 │
           │  1                         1    │
           │                                 │
           │  ┌──────────────────────────┐  │
           └─►│    Reservation           │◄─┘
              ├──────────────────────────┤
              │ id (PK)                  │
              │ checkInDate              │
              │ checkOutDate             │
              │ numberOfAdults           │
              │ numberOfChildren         │
              │ guestName                │
              │ guestEmail               │
              │ guestPhone               │
              │ specialRequests          │
              │ totalPrice (CALCULATED)  │
              │ status (ENUM)            │
              │ userId (FK) NULLABLE     │
              │ roomId (FK)              │
              │ createdAt                │
              │ updatedAt                │
              └──────────────────────────┘
                         N

Relaciones:
- User 1 → N Reservation (un usuario puede tener muchas reservas)
- Room 1 → N Reservation (una habitación puede tener muchas reservas)
- Reservation.userId → User.id (opcional, permite reservas sin cuenta)
- Reservation.roomId → Room.id (obligatorio)
```

## 🚀 Tecnologías y Dependencias

```
Backend Stack:
├── NestJS 11.x          (Framework principal)
├── Express              (HTTP server)
├── TypeScript 5.x       (Lenguaje)
├── TypeORM 0.3.x        (ORM)
├── PostgreSQL           (Base de datos)
├── Passport + JWT       (Autenticación)
├── Bcrypt               (Hash de contraseñas)
├── Class Validator      (Validaciones)
└── Class Transformer    (Transformación de objetos)

Arquitectura:
├── Modular              (Módulos independientes)
├── Dependency Injection (IoC Container)
├── Repository Pattern   (Acceso a datos)
└── DTO Pattern          (Validación de datos)
```

## 📈 Performance y Escalabilidad

### Optimizaciones Implementadas:
1. **Lazy Loading** de relaciones en TypeORM
2. **Indexes** en campos únicos (email, roomNumber)
3. **Connection pooling** de PostgreSQL
4. **Caching** de configuración con ConfigModule
5. **Validación anticipada** con ValidationPipe

### Recomendaciones para Producción:
1. **Redis** para sesiones y caching
2. **Load Balancer** (Nginx)
3. **Database Replication** (Master-Slave)
4. **CDN** para imágenes estáticas
5. **Rate Limiting** para prevenir abuso
6. **Logging** centralizado (Winston + ELK)
7. **Monitoring** (Prometheus + Grafana)

Esta arquitectura soporta escalamiento horizontal y vertical fácilmente.
