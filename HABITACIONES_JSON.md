# 🏨 JSON para Insertar las 3 Habitaciones del Hotel Acquamarina

Estos son los JSON completos y actualizados con el campo `name` (nombre de la habitación), `videoId` y los tipos correctos.

---

## 📋 Habitación 1: Saky Saky (Estándar)

**Copia y pega este JSON en Swagger (POST /rooms):**

```json
{
  "name": "Saky Saky",
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
- 🏷️ **Nombre:** Saky Saky
- 🚪 **Número:** 101
- 📦 **Tipo:** single (Estándar)
- 💰 **Precio:** $520/noche
- 👥 **Capacidad:** 2 personas
- 👶 **Niños:** 0
- 🎬 **Video:** https://www.youtube.com/watch?v=drLVfiBl1sg

---

## 📋 Habitación 2: Noronky (Cuádruple)

**Copia y pega este JSON en Swagger (POST /rooms):**

```json
{
  "name": "Noronky",
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
- 🏷️ **Nombre:** Noronky
- 🚪 **Número:** 201
- 📦 **Tipo:** quad (Cuádruple)
- 💰 **Precio:** $720/noche
- 👥 **Capacidad:** 4 personas
- 👶 **Niños:** 2
- 🎬 **Video:** https://www.youtube.com/watch?v=zjeCnz67CpU

---

## 📋 Habitación 3: Francisky (Familiar)

**Copia y pega este JSON en Swagger (POST /rooms):**

```json
{
  "name": "Francisky",
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
- 🏷️ **Nombre:** Francisky
- 🚪 **Número:** 301
- 📦 **Tipo:** family (Familiar)
- 💰 **Precio:** $980/noche
- 👥 **Capacidad:** 6 personas
- 👶 **Niños:** 3
- 🎬 **Video:** https://www.youtube.com/watch?v=EZ6tsYaqBYk

---

## 📊 Tabla Resumen

| Nombre | Número | Tipo | Precio | Capacidad | Niños | Video ID |
|--------|--------|------|--------|-----------|-------|----------|
| **Saky Saky** | 101 | single | $520 | 2 | 0 | drLVfiBl1sg |
| **Noronky** | 201 | quad | $720 | 4 | 2 | zjeCnz67CpU |
| **Francisky** | 301 | family | $980 | 6 | 3 | EZ6tsYaqBYk |

---

## 🚀 Pasos para Insertar Manualmente en Swagger

### 1️⃣ **Inicia el servidor:**
```bash
start-dev.bat
```

### 2️⃣ **Abre Swagger:**
```
http://localhost:3000/api
```

### 3️⃣ **Crea el usuario admin:**
- Ve a: `POST /auth/register`
- Click en "Try it out"
- Usa este JSON:

```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!",
  "fullName": "Administrador Hotel",
  "phone": "+123456789",
  "role": "admin"
}
```

- Click "Execute"
- **COPIA** el `access_token` completo

### 4️⃣ **Autoriza en Swagger:**
- Click en **"Authorize"** 🔓 (arriba a la derecha)
- Pega el token completo
- Click "Authorize" y "Close"

### 5️⃣ **Inserta cada habitación:**
- Ve a: `POST /rooms`
- Click "Try it out"
- Copia y pega el JSON de cada habitación (uno a la vez)
- Click "Execute"
- Verifica Response Code **201** ✅

### 6️⃣ **Verifica:**
- Ve a: `GET /rooms`
- Click "Try it out" y "Execute"
- Deberías ver las 3 habitaciones con sus nombres

---

## 📝 Campos Actualizados

Se agregaron los siguientes campos nuevos:

1. ✅ **`name`** - Nombre de la habitación (Saky Saky, Noronky, Francisky)
2. ✅ **`videoId`** - ID del video de YouTube para cada habitación
3. ✅ **`type: "quad"`** - Nuevo tipo para habitaciones cuádruples

---

## 🎬 Uso de Videos en el Frontend

Para usar los videos de YouTube en tu frontend:

```javascript
// URL completa del video
const videoUrl = `https://www.youtube.com/watch?v=${room.videoId}`;

// Para iframe/embed
const embedUrl = `https://www.youtube.com/embed/${room.videoId}`;

// Thumbnail del video
const thumbnailUrl = `https://img.youtube.com/vi/${room.videoId}/maxresdefault.jpg`;
```

---

## ✅ Endpoints Disponibles

Después de insertar las habitaciones, puedes usar:

- **GET /rooms** - Ver todas las habitaciones
- **GET /rooms/:id** - Ver una habitación específica
- **PATCH /rooms/:id** - Actualizar una habitación (requiere admin)
- **DELETE /rooms/:id** - Eliminar una habitación (requiere admin)
- **POST /reservations** - Crear reserva para una habitación

---

¡Listo! Ahora tienes todo lo necesario para insertar las 3 habitaciones manualmente con sus nombres. 🏨✨
