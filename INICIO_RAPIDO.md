# 🚀 Inicio Rápido - Hotel Acquamarina Backend

## ✅ Proyecto Completado

El backend está **100% funcional** con:

- ✅ **Autenticación JWT** completa (registro, login, perfil)
- ✅ **Gestión de Usuarios** (CRUD completo con roles)
- ✅ **Gestión de Habitaciones** (CRUD completo)
- ✅ **Sistema de Reservas** (crear, listar, actualizar, cancelar, confirmar)
- ✅ **Validaciones** automáticas en todos los endpoints
- ✅ **Cálculo automático de precios** basado en noches
- ✅ **Verificación de disponibilidad** de habitaciones
- ✅ **CORS habilitado** para el frontend
- ✅ **TypeScript** con tipado completo
- ✅ **PostgreSQL** con TypeORM

---

## 🎯 Pasos para Ejecutar (1 minuto)

### ⚡ Opción A: Con Docker (MÁS FÁCIL - Recomendado para Windows) 🐳

**No necesitas instalar PostgreSQL localmente**

#### 1. Asegúrate de tener **Docker Desktop** corriendo

#### 2. Doble clic en: `start-dev.bat`

**¡Listo!** El servidor está corriendo en `http://localhost:3000` 🎉

Este script hace todo automáticamente:
- ✅ Inicia PostgreSQL en Docker
- ✅ Espera a que la BD esté lista
- ✅ Inicia el servidor NestJS
- ✅ Crea las tablas automáticamente

**Comandos útiles:**
- `docker-start.bat` - Solo iniciar PostgreSQL
- `docker-stop.bat` - Detener PostgreSQL
- `docker-logs.bat` - Ver logs de la BD

**Ver guía completa:** [DOCKER.md](DOCKER.md)

---

### 🔧 Opción B: Con PostgreSQL Local

#### 1. Verificar que tienes PostgreSQL instalado y corriendo

```bash
# Abrir psql o pgAdmin y crear la base de datos:
CREATE DATABASE hotel_acquamarina;
```

#### 2. Configurar variables de entorno

Edita el archivo [.env](.env) si es necesario (ya está configurado por defecto):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres          # <- Cambiar si tienes otra contraseña
DB_DATABASE=hotel_acquamarina
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
PORT=3000
FRONTEND_URL=http://localhost:5173
```

#### 3. Instalar dependencias (si no están instaladas)

```bash
npm install
```

#### 4. Ejecutar el servidor

```bash
npm run start:dev
```

**¡Listo!** El servidor está corriendo en `http://localhost:3000` 🎉

Las tablas de la base de datos se crearán automáticamente.

---

## 🧪 Probar el Backend

### Opción 1: Usando el archivo HTTP (VSCode REST Client)

Abre [api-examples.http](api-examples.http) en VSCode y ejecuta las peticiones.

### Opción 2: Usando cURL

#### 1. Registrar un usuario admin:

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@acquamarina.com\",\"password\":\"Admin123!\",\"fullName\":\"Admin Hotel\",\"phone\":\"+123456789\",\"role\":\"admin\"}"
```

Copia el `access_token` de la respuesta.

#### 2. Crear una habitación:

```bash
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d "{\"roomNumber\":\"101\",\"type\":\"double\",\"pricePerNight\":120,\"capacity\":2,\"maxChildren\":1,\"description\":\"Habitación doble con vista al mar\",\"amenities\":[\"WiFi\",\"TV\",\"Aire acondicionado\"],\"status\":\"available\"}"
```

Copia el `id` de la habitación creada.

#### 3. Crear una reserva:

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d "{\"checkInDate\":\"2025-02-15\",\"checkOutDate\":\"2025-02-20\",\"numberOfAdults\":2,\"numberOfChildren\":1,\"guestName\":\"María González\",\"guestEmail\":\"maria@example.com\",\"guestPhone\":\"+123456789\",\"specialRequests\":\"Vista al mar\",\"roomId\":\"ID_DE_LA_HABITACION\"}"
```

#### 4. Ver todas las reservas:

```bash
curl http://localhost:3000/reservations \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📚 Documentación Completa

- **[README.md](README.md)** - Documentación completa de la API
- **[DOCKER.md](DOCKER.md)** - 🐳 Configuración con Docker (Recomendado)
- **[SETUP.md](SETUP.md)** - Guía detallada de configuración
- **[ESTRUCTURA.md](ESTRUCTURA.md)** - Arquitectura y estructura del proyecto
- **[FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)** - Integración con React/Vue/Angular
- **[ARQUITECTURA.md](ARQUITECTURA.md)** - Diagramas y flujos del sistema
- **[COMANDOS.md](COMANDOS.md)** - Referencia rápida de comandos
- **[api-examples.http](api-examples.http)** - Colección de peticiones HTTP

---

## 🌐 Endpoints Principales

### Autenticación (Público)
- `POST /auth/register` - Registrarse
- `POST /auth/login` - Iniciar sesión
- `GET /auth/me` - Obtener perfil (requiere token)

### Habitaciones
- `GET /rooms` - Listar todas las habitaciones (público)
- `GET /rooms/available?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD` - Habitaciones disponibles (público)
- `GET /rooms/:id` - Ver detalle de habitación (público)
- `POST /rooms` - Crear habitación (requiere token admin)
- `PATCH /rooms/:id` - Actualizar habitación (requiere token admin)
- `DELETE /rooms/:id` - Eliminar habitación (requiere token admin)

### Reservas
- `POST /reservations` - Crear reserva (público)
- `GET /reservations` - Listar reservas (requiere token, filtra por rol)
- `GET /reservations/my-reservations` - Mis reservas (requiere token)
- `GET /reservations/:id` - Ver reserva (público si tienes el ID)
- `PATCH /reservations/:id` - Actualizar reserva (requiere token)
- `PATCH /reservations/:id/confirm` - Confirmar reserva (requiere token)
- `PATCH /reservations/:id/cancel` - Cancelar reserva (requiere token)
- `DELETE /reservations/:id` - Eliminar reserva (requiere token)

### Usuarios
- `GET /users` - Listar usuarios (requiere token)
- `GET /users/:id` - Ver usuario (requiere token)
- `POST /users` - Crear usuario (público)
- `PATCH /users/:id` - Actualizar usuario (requiere token)
- `DELETE /users/:id` - Eliminar usuario (requiere token)

---

## 🔗 Conectar con el Frontend

### Configuración básica de Axios:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

Ver más ejemplos en [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)

---

## 🎨 Modelo del Formulario (del Frontend)

Basándome en tu imagen, el formulario del frontend debe enviar:

```javascript
{
  // Fechas
  checkInDate: "2025-02-15",    // De "Fecha de llegada"
  checkOutDate: "2025-02-20",   // De "Fecha de salida"

  // Huéspedes
  numberOfAdults: 2,             // De "Adultos" dropdown
  numberOfChildren: 1,           // De "Niños" dropdown

  // Información del huésped
  guestName: "Juan Pérez",       // De "Nombre completo"
  guestEmail: "juan@email.com",  // De "Correo electrónico"
  guestPhone: "+58 414 123 4567",// De "Teléfono"
  specialRequests: "...",        // De "Solicitudes especiales" textarea

  // ID de la habitación seleccionada
  roomId: "uuid-de-habitacion"
}
```

Endpoint: `POST http://localhost:3000/reservations`

---

## ⚙️ Scripts Disponibles

```bash
npm run start:dev     # Desarrollo (con hot-reload)
npm run build         # Compilar
npm run start:prod    # Producción
npm run start         # Iniciar (sin watch)
```

---

## 🐛 Solución de Problemas

### "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica las credenciales en [.env](.env)
- Verifica que la base de datos `hotel_acquamarina` exista

### "JWT must be provided"
- Asegúrate de incluir el header: `Authorization: Bearer {tu_token}`
- Verifica que el token no haya expirado (dura 7 días por defecto)

### "CORS Error" desde el frontend
- Actualiza `FRONTEND_URL` en [.env](.env) con la URL de tu frontend
- Reinicia el servidor después de cambiar el `.env`

### "Room is not available"
- La habitación ya está reservada para esas fechas
- Verifica las fechas o prueba con otra habitación

---

## 📊 Resumen del Proyecto

**Tecnologías:**
- NestJS 11.x
- TypeScript 5.x
- PostgreSQL
- TypeORM
- JWT Authentication
- Bcrypt (hash de contraseñas)
- Class Validator (validaciones)

**Estructura:**
```
src/
├── auth/          # Autenticación JWT
├── users/         # Gestión de usuarios
├── rooms/         # Gestión de habitaciones
├── reservations/  # Sistema de reservas
├── common/        # Guards y decoradores
└── main.ts        # Punto de entrada
```

**Base de Datos:**
- 3 tablas: `users`, `rooms`, `reservations`
- Relaciones: User → Reservations, Room → Reservations
- Auto-sincronización en desarrollo

---

## 🎯 Próximos Pasos Sugeridos

1. **Crear habitaciones** usando el admin (ver ejemplos arriba)
2. **Conectar tu frontend** usando los servicios de ejemplo
3. **Implementar pagos** (Stripe/PayPal) - opcional
4. **Agregar emails** de confirmación - opcional
5. **Deploy a producción** (Railway, Render, Heroku, etc.)

---

## 📞 Soporte

Si tienes dudas, revisa los archivos de documentación o contacta al equipo de desarrollo.

**¡El backend está listo para usar! 🚀**
