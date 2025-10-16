# ❌ Solución al Error "Unauthorized"

## 🔍 ¿Por qué ocurre?

El error "Unauthorized" al ejecutar `node seed-rooms.js` ocurre porque:

1. El endpoint `POST /rooms` **requiere autenticación** (es solo para admins)
2. Aunque el script obtiene el token, puede haber un problema con:
   - El formato del token
   - La expiración del token
   - La conexión entre peticiones

---

## ✅ SOLUCIÓN 1: Usar Swagger (MÁS FÁCIL - RECOMENDADO)

### **Paso a Paso:**

#### **1. Asegúrate de que el servidor esté corriendo**
```bash
start-dev.bat
```

Espera a ver:
```
🚀 Application is running on: http://localhost:3000
📚 Swagger documentation: http://localhost:3000/api
```

#### **2. Abre Swagger en tu navegador**
```
http://localhost:3000/api
```

#### **3. Crear usuario admin**

1. Busca la sección **"Authentication"**
2. Expande `POST /auth/register`
3. Click en **"Try it out"**
4. Reemplaza el contenido del Request body con:

```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!",
  "fullName": "Administrador Hotel",
  "phone": "+123456789",
  "role": "admin"
}
```

5. Click en **"Execute"**
6. **Copia el `access_token`** de la respuesta (todo el texto largo que empieza con "eyJ...")

#### **4. Autorizar Swagger con el token**

1. Arriba a la derecha, busca el botón **"Authorize" 🔓** (candado verde)
2. Click en él
3. En el modal que aparece, pega el token completo
4. Click en **"Authorize"**
5. Click en **"Close"**

**¡El candado ahora debe estar cerrado 🔒!**

#### **5. Insertar las 3 habitaciones**

Busca la sección **"Rooms"** y expande `POST /rooms`

**Para cada habitación:**

1. Click en **"Try it out"**
2. Borra el contenido del Request body
3. Pega el JSON correspondiente (ver abajo)
4. Click en **"Execute"**
5. Verifica que el Response code sea **201**

---

### **JSON de las Habitaciones:**

#### **Habitación 1: Saky Saky**
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
  "status": "available"
}
```

#### **Habitación 2: Noronky**
```json
{
  "roomNumber": "201",
  "type": "family",
  "pricePerNight": 720,
  "capacity": 4,
  "maxChildren": 2,
  "description": "Habitación familiar amplia con dos camas Queen size. Perfecta para familias o grupos que buscan espacio y comodidad en un ambiente elegante.",
  "amenities": [
    "Aire acondicionado",
    "Smart TV",
    "Caja fuerte",
    "Almohadas y edredones de plumón de fabricación italiana"
  ],
  "status": "available"
}
```

#### **Habitación 3: Francisky**
```json
{
  "roomNumber": "301",
  "type": "suite",
  "pricePerNight": 980,
  "capacity": 6,
  "maxChildren": 3,
  "description": "Nuestra suite familiar más espaciosa. Ideal para familias grandes con múltiples espacios de descanso y áreas comunes. Incluye 1 Cama King + 2 Sofá Cama.",
  "amenities": [
    "Aire acondicionado",
    "Smart TV",
    "Caja fuerte",
    "Almohadas y edredones de plumón de fabricación italiana"
  ],
  "status": "available"
}
```

---

### **6. Verificar que se crearon**

1. En Swagger, busca `GET /rooms`
2. Click en "Try it out"
3. Click en "Execute"
4. Deberías ver las 3 habitaciones en la respuesta

O abre en tu navegador:
```
http://localhost:3000/rooms
```

---

## ✅ SOLUCIÓN 2: Modificar el Script Node.js

Voy a crear una versión mejorada del script que maneje mejor los errores.

---

## 🐛 Problemas Comunes y Soluciones

### **1. "Unauthorized" después de autorizar en Swagger**

**Causa:** El token expiró o no se copió completo.

**Solución:**
1. Hacer login nuevamente: `POST /auth/login`
2. Copiar el **token completo** (incluye todo el texto)
3. Click en "Authorize" 🔓
4. Pegar el token completo
5. Click en "Authorize" y "Close"

---

### **2. "Email already exists" al registrar**

**Causa:** El usuario admin ya existe.

**Solución:**
1. Usa `POST /auth/login` en lugar de `/auth/register`
2. Datos:
```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!"
}
```

---

### **3. El script falla con "fetch failed"**

**Causa:** El servidor no está corriendo.

**Solución:**
```bash
start-dev.bat
```

Espera a que veas:
```
🚀 Application is running on: http://localhost:3000
```

---

### **4. "Cannot read properties of undefined"**

**Causa:** El token no se obtuvo correctamente.

**Solución:** Usa Swagger en lugar del script (Método 1).

---

## 💡 Verificación Paso a Paso

### **Checklist:**

- [ ] ¿El servidor está corriendo? (`start-dev.bat`)
- [ ] ¿Docker está corriendo? (Docker Desktop abierto)
- [ ] ¿PostgreSQL está activo? (ver logs con `docker-compose ps`)
- [ ] ¿Puedes abrir Swagger? (http://localhost:3000/api)
- [ ] ¿Creaste el usuario admin?
- [ ] ¿Copiaste el token **completo**?
- [ ] ¿Autorizaste Swagger? (candado cerrado 🔒)

---

## 📊 Flujo Correcto en Swagger

```
1. start-dev.bat
   ↓
2. http://localhost:3000/api
   ↓
3. POST /auth/register (crear admin)
   ↓
4. Copiar access_token
   ↓
5. Click "Authorize" 🔓
   ↓
6. Pegar token completo
   ↓
7. Click "Authorize" y "Close"
   ↓
8. POST /rooms (3 veces, una por habitación)
   ↓
9. GET /rooms (verificar)
   ✅ ¡3 habitaciones creadas!
```

---

## 🎯 Resumen

**La forma más confiable es usar Swagger:**

1. `start-dev.bat`
2. http://localhost:3000/api
3. Registrar admin
4. Autorizar con el token
5. Copiar/pegar cada JSON en `POST /rooms`

**Tiempo estimado: 5 minutos**

---

## 🆘 Si Nada Funciona

### **Resetear todo:**

```bash
# 1. Detener el servidor (Ctrl+C)

# 2. Detener Docker
docker-compose down

# 3. Eliminar la base de datos (CUIDADO: borra todo)
docker-compose down -v

# 4. Reiniciar todo
start-dev.bat
```

Esto creará la base de datos desde cero.

---

## ✅ Resultado Esperado

Después de insertar las 3 habitaciones, al hacer `GET /rooms` deberías ver:

```json
[
  {
    "id": "uuid-generado-1",
    "roomNumber": "101",
    "type": "single",
    "pricePerNight": 520,
    ...
  },
  {
    "id": "uuid-generado-2",
    "roomNumber": "201",
    "type": "family",
    "pricePerNight": 720,
    ...
  },
  {
    "id": "uuid-generado-3",
    "roomNumber": "301",
    "type": "suite",
    "pricePerNight": 980,
    ...
  }
]
```

---

**¡Usa Swagger, es mucho más fácil y confiable!** 📚
