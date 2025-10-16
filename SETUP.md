# Guía de Configuración Inicial

## Paso 1: Instalar PostgreSQL

Si no tienes PostgreSQL instalado, descárgalo desde: https://www.postgresql.org/download/

## Paso 2: Crear la Base de Datos

Abre pgAdmin o la línea de comandos de PostgreSQL y ejecuta:

```sql
CREATE DATABASE hotel_acquamarina;
```

## Paso 3: Configurar Variables de Entorno

Ya tienes el archivo `.env` configurado. Solo asegúrate de actualizar:
- `DB_PASSWORD`: Tu contraseña de PostgreSQL
- `JWT_SECRET`: Una clave secreta fuerte
- `FRONTEND_URL`: La URL de tu frontend (por defecto: http://localhost:5173)

## Paso 4: Instalar Dependencias y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run start:dev
```

El servidor creará automáticamente las tablas en la base de datos.

## Paso 5: Crear Datos de Prueba

### Crear Usuario Administrador

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acquamarina.com",
    "password": "Admin123!",
    "fullName": "Administrador Hotel",
    "phone": "+123456789",
    "role": "admin"
  }'
```

Guarda el `access_token` que recibes en la respuesta.

### Crear Habitaciones de Ejemplo

```bash
# Habitación Simple
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "roomNumber": "101",
    "type": "single",
    "pricePerNight": 80,
    "capacity": 1,
    "maxChildren": 0,
    "description": "Habitación individual con vista al jardín",
    "amenities": ["WiFi", "TV", "Aire acondicionado"],
    "status": "available"
  }'

# Habitación Doble
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "roomNumber": "201",
    "type": "double",
    "pricePerNight": 120,
    "capacity": 2,
    "maxChildren": 1,
    "description": "Habitación doble con vista al mar",
    "amenities": ["WiFi", "TV", "Aire acondicionado", "Mini bar", "Balcón"],
    "status": "available"
  }'

# Suite
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "roomNumber": "301",
    "type": "suite",
    "pricePerNight": 250,
    "capacity": 2,
    "maxChildren": 2,
    "description": "Suite de lujo con jacuzzi y vista panorámica",
    "amenities": ["WiFi", "TV", "Aire acondicionado", "Mini bar", "Jacuzzi", "Balcón", "Sala de estar"],
    "status": "available"
  }'

# Habitación Familiar
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
    "roomNumber": "401",
    "type": "family",
    "pricePerNight": 180,
    "capacity": 4,
    "maxChildren": 3,
    "description": "Habitación amplia ideal para familias",
    "amenities": ["WiFi", "TV", "Aire acondicionado", "Cocina pequeña", "2 baños"],
    "status": "available"
  }'
```

### Crear una Reserva de Prueba

Primero, obtén el ID de una habitación:

```bash
curl http://localhost:3000/rooms
```

Luego crea la reserva:

```bash
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2025-02-01",
    "checkOutDate": "2025-02-05",
    "numberOfAdults": 2,
    "numberOfChildren": 1,
    "guestName": "María González",
    "guestEmail": "maria@example.com",
    "guestPhone": "+123456789",
    "specialRequests": "Cama extra para niño, vista al mar preferentemente",
    "roomId": "ID_DE_LA_HABITACION_AQUI"
  }'
```

## Paso 6: Verificar que Todo Funciona

### Listar habitaciones disponibles
```bash
curl http://localhost:3000/rooms
```

### Listar reservas (como admin)
```bash
curl http://localhost:3000/reservations \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### Verificar perfil de usuario
```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Conectar con el Frontend

Una vez que el backend esté corriendo:

1. La API estará disponible en `http://localhost:3000`
2. Configura tu frontend para hacer peticiones a esta URL
3. Usa el token JWT en el header `Authorization: Bearer {token}`

### Ejemplo de integración con Axios (React/Vue):

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Agregar token a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.access_token);
  return response.data;
};

// Crear reserva
const createReservation = async (reservationData) => {
  const response = await api.post('/reservations', reservationData);
  return response.data;
};

// Obtener habitaciones
const getRooms = async () => {
  const response = await api.get('/rooms');
  return response.data;
};
```

## Solución de Problemas Comunes

### Error: "Connection refused" o no puede conectar a PostgreSQL
- Verifica que PostgreSQL está corriendo
- Verifica las credenciales en el archivo `.env`
- Verifica que el puerto 5432 esté disponible

### Error: "JWT must be provided"
- Asegúrate de incluir el header `Authorization: Bearer {token}` en las peticiones protegidas
- Verifica que el token no haya expirado

### Error: "Room is not available"
- La habitación ya tiene una reserva para esas fechas
- Verifica las fechas de check-in y check-out

### CORS Error desde el frontend
- Verifica que `FRONTEND_URL` en `.env` coincida con la URL de tu frontend
- Reinicia el servidor después de cambiar el `.env`
