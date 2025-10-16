# 🏨 Insertar las 3 Habitaciones del Hotel Acquamarina

## 📋 Método 1: Usando Swagger (Recomendado - Más Fácil) ⭐

### **Paso 1: Iniciar el servidor**
```bash
start-dev.bat
```

Espera a ver este mensaje:
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api
```

### **Paso 2: Abrir Swagger**
```
http://localhost:3000/api
```

### **Paso 3: Crear usuario admin**

1. Busca la sección **"Authentication"** (color verde)
2. Expande `POST /auth/register`
3. Click en **"Try it out"** (botón azul a la derecha)
4. **Borra todo** el contenido del Request body
5. Pega este JSON:

```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!",
  "fullName": "Administrador Hotel",
  "phone": "+123456789",
  "role": "admin"
}
```

6. Click en **"Execute"** (botón azul grande)
7. En la respuesta (abajo), busca y **copia el `access_token` completo**

**Importante:** El token es un texto largo que empieza con "eyJ..." - cópialo TODO.

**Si dice "Email already exists":** Usa `POST /auth/login` en lugar de register, con:
```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!"
}
```

### **Paso 4: Autorizar Swagger con el token**

1. Arriba a la derecha, busca el botón **"Authorize" 🔓** (candado verde)
2. Click en él
3. En el campo "Value", pega el token que copiaste (todo el texto)
4. Click en **"Authorize"** (botón negro)
5. Click en **"Close"**

**✅ El candado ahora debe estar cerrado 🔒**

### **Paso 5: Insertar las 3 habitaciones**

Busca la sección **"Rooms"** (color verde) y expande `POST /rooms`.

**Para CADA habitación:**

1. Click en **"Try it out"**
2. **Borra todo** el contenido del Request body
3. Pega el JSON correspondiente (ver abajo)
4. Click en **"Execute"**
5. **Verifica que el Response code sea 201** (verde)
6. Repite para las otras 2 habitaciones

---

#### **Habitación 1: Saky Saky (Estándar)**

```json
{
  "roomNumber": "101",
  "type": "single",
  "pricePerNight": 520,
  "capacity": 2,
  "maxChildren": 0,
  "description": "Nuestra habitación estándar. Espaciosas habitaciones equipadas con una cama Queen size ideales para parejas que buscan comfort y descanso. Máximo 2 personas.",
  "amenities": [
    "Aire acondicionado",
    "Smart TV",
    "Caja fuerte",
    "Almohadas y edredones de plumón de fabricación italiana"
  ],
  "status": "available",
  "videoId": "drLVfiBl1sg"
}
```

**Características:**
- 💰 **Precio:** $520 por noche (antes $632)
- 🛏️ **Camas:** 1 Cama Queen Size
- 👥 **Capacidad:** Máximo 2 Huéspedes
- 🏠 **Total:** 11 Habitaciones
- 📦 **Tipo:** Estándar

---

#### **Habitación 2: Noronky (Cuádruple)**

```json
{
  "roomNumber": "201",
  "type": "quad",
  "pricePerNight": 720,
  "capacity": 4,
  "maxChildren": 2,
  "description": "Habitación cuádruple amplia con dos camas Queen size. Perfecta para familias o grupos que buscan espacio y comodidad en un ambiente elegante.",
  "amenities": [
    "Aire acondicionado",
    "Smart TV",
    "Caja fuerte",
    "Almohadas y edredones de plumón de fabricación italiana"
  ],
  "status": "available",
  "videoId": "zjeCnz67CpU"
}
```

**Características:**
- 💰 **Precio:** $720 por noche (antes $890)
- 🛏️ **Camas:** 2 Camas Queen Size
- 👥 **Capacidad:** Máximo 4 Huéspedes
- 🏠 **Total:** 8 Habitaciones
- 📦 **Tipo:** Cuádruple

---

#### **Habitación 3: Francisky (Familiar)**

```json
{
  "roomNumber": "301",
  "type": "family",
  "pricePerNight": 980,
  "capacity": 6,
  "maxChildren": 3,
  "description": "Nuestra habitación familiar más espaciosa. Ideal para familias grandes con múltiples espacios de descanso y áreas comunes. Incluye 1 Cama King + 2 Sofá Cama.",
  "amenities": [
    "Aire acondicionado",
    "Smart TV",
    "Caja fuerte",
    "Almohadas y edredones de plumón de fabricación italiana"
  ],
  "status": "available",
  "videoId": "EZ6tsYaqBYk"
}
```

**Características:**
- 💰 **Precio:** $980 por noche (antes $1200)
- 🛏️ **Camas:** 1 Cama King + 2 Sofá Cama
- 👥 **Capacidad:** Máximo 6 Huéspedes
- 🏠 **Total:** 4 Habitaciones
- 📦 **Tipo:** Familiar

---

### **Paso 6: Verificar que se crearon**

1. Busca `GET /rooms` en Swagger
2. Click en "Try it out"
3. Click en "Execute"
4. Deberías ver las 3 habitaciones

---

## 📋 Método 2: Usando el Script de Node.js

### **Ejecutar el script automático:**

```bash
# 1. Asegúrate de que el servidor esté corriendo
start-dev.bat

# 2. En otra terminal, ejecuta:
node seed-rooms.js
```

Este script:
- ✅ Crea el usuario admin automáticamente
- ✅ Inserta las 3 habitaciones
- ✅ Muestra el progreso en la terminal

---

## 📋 Método 3: Usando SQL Directo

Si prefieres insertar directo en PostgreSQL:

```bash
# Conectar al contenedor de Docker
docker exec -it hotel-acquamarina-db psql -U postgres -d hotel_acquamarina

# Ejecutar el archivo SQL
\i /path/to/seed-rooms.sql
```

O ejecuta el archivo `seed-rooms.sql` con tu cliente de PostgreSQL favorito (pgAdmin, DBeaver, etc.)

---

## 📋 Método 4: Usando cURL (Windows)

### **1. Hacer login:**

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@acquamarina.com\",\"password\":\"Admin123!\"}"
```

Copia el `access_token` de la respuesta.

### **2. Insertar habitación 1 (Saky Saky):**

```bash
curl -X POST http://localhost:3000/rooms ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TU_TOKEN_AQUI" ^
  -d "{\"roomNumber\":\"101\",\"type\":\"single\",\"pricePerNight\":520,\"capacity\":2,\"maxChildren\":0,\"description\":\"Nuestra habitación estándar. Espaciosas habitaciones equipadas con una cama Queen size ideales para parejas que buscan comfort y descanso. Máximo 2 personas.\",\"amenities\":[\"Aire acondicionado\",\"Smart TV\",\"Caja fuerte\",\"Almohadas y edredones de plumón de fabricación italiana\"],\"status\":\"available\",\"videoId\":\"drLVfiBl1sg\"}"
```

### **3. Insertar habitación 2 (Noronky):**

```bash
curl -X POST http://localhost:3000/rooms ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TU_TOKEN_AQUI" ^
  -d "{\"roomNumber\":\"201\",\"type\":\"quad\",\"pricePerNight\":720,\"capacity\":4,\"maxChildren\":2,\"description\":\"Habitación cuádruple amplia con dos camas Queen size. Perfecta para familias o grupos que buscan espacio y comodidad en un ambiente elegante.\",\"amenities\":[\"Aire acondicionado\",\"Smart TV\",\"Caja fuerte\",\"Almohadas y edredones de plumón de fabricación italiana\"],\"status\":\"available\",\"videoId\":\"zjeCnz67CpU\"}"
```

### **4. Insertar habitación 3 (Francisky):**

```bash
curl -X POST http://localhost:3000/rooms ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer TU_TOKEN_AQUI" ^
  -d "{\"roomNumber\":\"301\",\"type\":\"family\",\"pricePerNight\":980,\"capacity\":6,\"maxChildren\":3,\"description\":\"Nuestra habitación familiar más espaciosa. Ideal para familias grandes con múltiples espacios de descanso y áreas comunes. Incluye 1 Cama King + 2 Sofá Cama.\",\"amenities\":[\"Aire acondicionado\",\"Smart TV\",\"Caja fuerte\",\"Almohadas y edredones de plumón de fabricación italiana\"],\"status\":\"available\",\"videoId\":\"EZ6tsYaqBYk\"}"
```

---

## ✅ Verificar que se Insertaron

### **Opción 1: Swagger**
```
http://localhost:3000/api
```
- Busca `GET /rooms`
- Click en "Try it out"
- Click en "Execute"

### **Opción 2: Navegador**
```
http://localhost:3000/rooms
```

### **Opción 3: Base de datos**
```sql
SELECT "roomNumber", type, "pricePerNight", capacity, description
FROM rooms
ORDER BY "roomNumber";
```

---

## 📊 Resumen de las Habitaciones

| Habitación | Número | Tipo | Precio/Noche | Capacidad | Niños | Video ID | Estado |
|------------|--------|------|--------------|-----------|-------|----------|--------|
| **Saky Saky** | 101 | single (Estándar) | $520 | 2 | 0 | drLVfiBl1sg | available |
| **Noronky** | 201 | quad (Cuádruple) | $720 | 4 | 2 | zjeCnz67CpU | available |
| **Francisky** | 301 | family (Familiar) | $980 | 6 | 3 | EZ6tsYaqBYk | available |

**Todas incluyen:**
- ✅ Aire acondicionado
- ✅ Smart TV
- ✅ Caja fuerte
- ✅ Almohadas y edredones de plumón de fabricación italiana

---

## 🎯 Recomendación

**La forma más fácil es usar Swagger:**

1. `start-dev.bat`
2. Abrir http://localhost:3000/api
3. Registrar admin
4. Autorizar
5. Copiar y pegar cada JSON en `POST /rooms`

**¡Listo en 5 minutos!** 🚀
