# 📝 Comandos Útiles - Referencia Rápida

## 🚀 Iniciar el Proyecto

```bash
# Desarrollo (con hot-reload)
npm run start:dev

# Producción
npm run build
npm run start:prod

# Modo normal (sin watch)
npm run start
```

## 🗄️ PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE hotel_acquamarina;

# Conectar a la base de datos
\c hotel_acquamarina

# Ver tablas
\dt

# Ver estructura de tabla
\d reservations

# Salir de psql
\q
```

## 🧪 Testing API con cURL

### Autenticación

```bash
# Registrar Admin
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acquamarina.com",
    "password": "Admin123!",
    "fullName": "Admin Hotel",
    "phone": "+123456789",
    "role": "admin"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acquamarina.com",
    "password": "Admin123!"
  }'

# Ver perfil (reemplaza TOKEN)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Habitaciones

```bash
# Listar todas las habitaciones
curl http://localhost:3000/rooms

# Habitaciones disponibles
curl "http://localhost:3000/rooms/available?checkIn=2025-02-15&checkOut=2025-02-20"

# Crear habitación doble (reemplaza TOKEN)
curl -X POST http://localhost:3000/rooms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "roomNumber": "201",
    "type": "double",
    "pricePerNight": 120,
    "capacity": 2,
    "maxChildren": 1,
    "description": "Habitación doble con vista al mar",
    "amenities": ["WiFi", "TV", "Aire acondicionado", "Mini bar"],
    "status": "available"
  }'

# Ver habitación específica (reemplaza ROOM_ID)
curl http://localhost:3000/rooms/ROOM_ID

# Actualizar habitación (reemplaza TOKEN y ROOM_ID)
curl -X PATCH http://localhost:3000/rooms/ROOM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "pricePerNight": 130,
    "status": "available"
  }'

# Eliminar habitación (reemplaza TOKEN y ROOM_ID)
curl -X DELETE http://localhost:3000/rooms/ROOM_ID \
  -H "Authorization: Bearer TOKEN"
```

### Reservas

```bash
# Crear reserva (reemplaza ROOM_ID)
curl -X POST http://localhost:3000/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "checkInDate": "2025-02-15",
    "checkOutDate": "2025-02-20",
    "numberOfAdults": 2,
    "numberOfChildren": 1,
    "guestName": "María González",
    "guestEmail": "maria@example.com",
    "guestPhone": "+58 414 123 4567",
    "specialRequests": "Cama extra para niño, vista al mar",
    "roomId": "ROOM_ID"
  }'

# Listar todas las reservas (reemplaza TOKEN)
curl http://localhost:3000/reservations \
  -H "Authorization: Bearer TOKEN"

# Mis reservas (reemplaza TOKEN)
curl http://localhost:3000/reservations/my-reservations \
  -H "Authorization: Bearer TOKEN"

# Ver reserva específica (reemplaza RESERVATION_ID)
curl http://localhost:3000/reservations/RESERVATION_ID

# Confirmar reserva (reemplaza TOKEN y RESERVATION_ID)
curl -X PATCH http://localhost:3000/reservations/RESERVATION_ID/confirm \
  -H "Authorization: Bearer TOKEN"

# Cancelar reserva (reemplaza TOKEN y RESERVATION_ID)
curl -X PATCH http://localhost:3000/reservations/RESERVATION_ID/cancel \
  -H "Authorization: Bearer TOKEN"

# Actualizar reserva (reemplaza TOKEN y RESERVATION_ID)
curl -X PATCH http://localhost:3000/reservations/RESERVATION_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "specialRequests": "Actualización: llegada tarde 11pm"
  }'
```

### Usuarios

```bash
# Listar usuarios (reemplaza TOKEN)
curl http://localhost:3000/users \
  -H "Authorization: Bearer TOKEN"

# Ver usuario específico (reemplaza TOKEN y USER_ID)
curl http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer TOKEN"

# Crear usuario
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@example.com",
    "password": "password123",
    "fullName": "Nuevo Usuario",
    "phone": "+123456789",
    "role": "user"
  }'
```

## 🐘 Consultas SQL Útiles

```sql
-- Ver todas las reservas con información de habitación
SELECT
  r.id,
  r."checkInDate",
  r."checkOutDate",
  r."guestName",
  r."guestEmail",
  r."totalPrice",
  r.status,
  room."roomNumber",
  room.type
FROM reservations r
JOIN rooms room ON r."roomId" = room.id
ORDER BY r."createdAt" DESC;

-- Contar reservas por estado
SELECT status, COUNT(*) as total
FROM reservations
GROUP BY status;

-- Ver habitaciones más reservadas
SELECT
  room."roomNumber",
  room.type,
  COUNT(r.id) as total_reservas
FROM rooms room
LEFT JOIN reservations r ON room.id = r."roomId"
GROUP BY room.id, room."roomNumber", room.type
ORDER BY total_reservas DESC;

-- Ver usuarios con más reservas
SELECT
  u."fullName",
  u.email,
  COUNT(r.id) as total_reservas
FROM users u
LEFT JOIN reservations r ON u.id = r."userId"
GROUP BY u.id, u."fullName", u.email
ORDER BY total_reservas DESC;

-- Ingresos totales por mes
SELECT
  DATE_TRUNC('month', r."checkInDate") as mes,
  SUM(r."totalPrice") as ingresos_totales,
  COUNT(*) as num_reservas
FROM reservations r
WHERE r.status = 'confirmed'
GROUP BY mes
ORDER BY mes DESC;

-- Verificar disponibilidad de habitación
SELECT * FROM reservations
WHERE "roomId" = 'TU_ROOM_ID_AQUI'
AND status != 'cancelled'
AND (
  "checkInDate" < '2025-02-20'
  AND "checkOutDate" > '2025-02-15'
);
```

## 🔧 NPM Scripts

```bash
# Instalación
npm install                    # Instalar dependencias

# Desarrollo
npm run start:dev             # Modo desarrollo con watch
npm run start:debug           # Modo debug

# Producción
npm run build                 # Compilar TypeScript
npm run start:prod            # Ejecutar versión compilada

# Otros
npm run lint                  # Revisar código
npm run format                # Formatear código
npm run test                  # Ejecutar tests
npm run test:watch            # Tests en modo watch
npm run test:cov              # Tests con coverage
```

## 🧹 Comandos de Limpieza

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpiar archivos compilados
rm -rf dist

# Recompilar
npm run build
```

## 📊 Monitoreo y Logs

```bash
# Ver logs en tiempo real (desarrollo)
npm run start:dev

# Ver logs de PostgreSQL (Linux/Mac)
tail -f /var/log/postgresql/postgresql-*.log

# Ver logs de PostgreSQL (Windows)
# Buscar en: C:\Program Files\PostgreSQL\<version>\data\log\
```

## 🐋 Docker (Opcional)

Si decides usar Docker para PostgreSQL:

```bash
# Iniciar PostgreSQL con Docker
docker run --name postgres-hotel \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hotel_acquamarina \
  -p 5432:5432 \
  -d postgres:15

# Ver logs del contenedor
docker logs postgres-hotel

# Conectar a psql en el contenedor
docker exec -it postgres-hotel psql -U postgres -d hotel_acquamarina

# Detener contenedor
docker stop postgres-hotel

# Iniciar contenedor existente
docker start postgres-hotel

# Eliminar contenedor
docker rm postgres-hotel
```

## 🌐 Variables de Entorno

```bash
# Archivo .env (editar según necesidad)

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=hotel_acquamarina

# JWT
JWT_SECRET=cambiar_en_produccion
JWT_EXPIRATION=7d

# Servidor
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

## 🔐 Backup y Restauración

```bash
# Backup de la base de datos
pg_dump -U postgres hotel_acquamarina > backup.sql

# Backup con fecha
pg_dump -U postgres hotel_acquamarina > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U postgres hotel_acquamarina < backup.sql

# Backup solo datos (sin estructura)
pg_dump -U postgres --data-only hotel_acquamarina > data_backup.sql

# Backup solo estructura (sin datos)
pg_dump -U postgres --schema-only hotel_acquamarina > schema_backup.sql
```

## 🚀 Deploy a Producción

### Railway.app

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Conectar PostgreSQL
railway add postgresql

# Deploy
railway up

# Ver logs
railway logs
```

### Render.com

1. Conectar repositorio de GitHub
2. Configurar como "Web Service"
3. Build Command: `npm install && npm run build`
4. Start Command: `npm run start:prod`
5. Agregar variables de entorno
6. Agregar PostgreSQL desde Dashboard

### Heroku

```bash
# Login
heroku login

# Crear app
heroku create hotel-acquamarina-api

# Agregar PostgreSQL
heroku addons:create heroku-postgresql:mini

# Configurar variables
heroku config:set JWT_SECRET=tu_secreto_aqui
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Ver logs
heroku logs --tail
```

## 📱 Testing con Postman

1. Importar colección desde [api-examples.http](api-examples.http)
2. Crear variable de entorno `{{baseUrl}}` = `http://localhost:3000`
3. Crear variable `{{token}}` para el JWT
4. Ejecutar peticiones

## 🔍 Debugging

```bash
# Modo debug (Node Inspector)
npm run start:debug

# Luego abrir Chrome en: chrome://inspect
# Y conectar al debugger

# Debug con VSCode
# Crear .vscode/launch.json:
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "port": 9229
}
```

## 💡 Tips Rápidos

```bash
# Ver puerto en uso (si 3000 está ocupado)
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000

# Matar proceso
# Windows
taskkill /PID <PID> /F

# Linux/Mac
kill -9 <PID>

# Limpiar caché de npm
npm cache clean --force

# Actualizar dependencias
npm update

# Ver dependencias desactualizadas
npm outdated
```

---

## 📚 Referencia Rápida de Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Registrarse |
| POST | `/auth/login` | ❌ | Login |
| GET | `/auth/me` | ✅ | Ver perfil |
| GET | `/rooms` | ❌ | Listar habitaciones |
| GET | `/rooms/available` | ❌ | Habitaciones disponibles |
| POST | `/rooms` | ✅ | Crear habitación |
| POST | `/reservations` | ❌ | Crear reserva |
| GET | `/reservations` | ✅ | Listar reservas |
| PATCH | `/reservations/:id/confirm` | ✅ | Confirmar reserva |
| PATCH | `/reservations/:id/cancel` | ✅ | Cancelar reserva |

**Leyenda**: ✅ = Requiere token JWT | ❌ = Público
