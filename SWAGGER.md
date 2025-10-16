# 📚 Documentación Swagger - Hotel Acquamarina API

## 🎯 ¿Qué es Swagger?

**Swagger** (OpenAPI) es una interfaz visual interactiva que te permite:
- ✅ **Ver** todos los endpoints de la API
- ✅ **Probar** los endpoints directamente desde el navegador
- ✅ **Documentar** automáticamente todos los parámetros
- ✅ **Autenticar** con JWT para probar rutas protegidas
- ✅ **Validar** respuestas y esquemas

**¡Es como Postman pero integrado en tu API!** 🚀

---

## 🌐 Acceder a Swagger

Una vez que el servidor esté corriendo (`npm run start:dev`), abre tu navegador en:

```
http://localhost:3000/api
```

Verás una interfaz visual con todos los endpoints organizados por categorías.

---

## 📋 Categorías de Endpoints

Swagger organiza automáticamente los endpoints en estas categorías:

### 🔐 **Authentication**
- Registro de usuarios
- Login
- Obtener perfil del usuario autenticado

### 🏨 **Rooms**
- Listar habitaciones
- Buscar habitaciones disponibles
- Crear/Actualizar/Eliminar habitaciones (Admin)

### 📅 **Reservations**
- Crear reserva
- Listar reservas
- Confirmar/Cancelar reserva
- Actualizar/Eliminar reserva

### 👥 **Users**
- Gestión de usuarios (CRUD)

---

## 🔑 Cómo Usar Swagger con Autenticación JWT

Muchos endpoints requieren autenticación. Sigue estos pasos:

### **1. Registrar un usuario o hacer login**

1. En Swagger, busca la sección **Authentication**
2. Click en `POST /auth/login` o `POST /auth/register`
3. Click en **"Try it out"**
4. Ingresa los datos:

   ```json
   {
     "email": "admin@acquamarina.com",
     "password": "Admin123!"
   }
   ```

5. Click en **"Execute"**
6. En la respuesta, **copia el `access_token`**:

   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": { ... }
   }
   ```

### **2. Autorizar Swagger con el Token**

1. En la parte superior derecha de Swagger, click en el botón **"Authorize" 🔓** (o el candado verde)
2. En el modal que aparece, pega el token que copiaste
3. Click en **"Authorize"**
4. Click en **"Close"**

**¡Listo!** Ahora todos los endpoints protegidos funcionarán. El candado cambiará a 🔒 (cerrado).

---

## 🧪 Probar un Endpoint

### **Ejemplo: Crear una Reserva**

1. En Swagger, busca **Reservations** → `POST /reservations`
2. Click en **"Try it out"**
3. Verás el **Request body** con un ejemplo prellenado:

   ```json
   {
     "checkInDate": "2025-02-15",
     "checkOutDate": "2025-02-20",
     "numberOfAdults": 2,
     "numberOfChildren": 1,
     "guestName": "María González",
     "guestEmail": "maria@example.com",
     "guestPhone": "+58 414 123 4567",
     "specialRequests": "Cama extra para niño, vista al mar",
     "roomId": "uuid-de-habitacion"
   }
   ```

4. **Modifica** el `roomId` con un ID real (o usa el ejemplo si ya creaste habitaciones)
5. Click en **"Execute"**
6. Verás la **respuesta** con el código HTTP y el JSON resultante:

   ```json
   {
     "id": "uuid-generado",
     "checkInDate": "2025-02-15",
     "totalPrice": 600,
     "status": "pending",
     ...
   }
   ```

---

## 🔄 Flujo Completo de Prueba

### **1. Crear Usuario Admin**

**Endpoint:** `POST /auth/register`

```json
{
  "email": "admin@acquamarina.com",
  "password": "Admin123!",
  "fullName": "Admin Hotel",
  "phone": "+123456789",
  "role": "admin"
}
```

✅ Copia el `access_token` y **autoriza Swagger**

---

### **2. Crear Habitaciones**

**Endpoint:** `POST /rooms` (requiere autenticación)

```json
{
  "roomNumber": "101",
  "type": "double",
  "pricePerNight": 120,
  "capacity": 2,
  "maxChildren": 1,
  "description": "Habitación doble con vista al mar",
  "amenities": ["WiFi", "TV", "Aire acondicionado"],
  "status": "available"
}
```

✅ Copia el `id` de la habitación creada

---

### **3. Listar Habitaciones**

**Endpoint:** `GET /rooms` (público)

Verás todas las habitaciones que creaste.

---

### **4. Crear Reserva**

**Endpoint:** `POST /reservations` (público)

```json
{
  "checkInDate": "2025-02-15",
  "checkOutDate": "2025-02-20",
  "numberOfAdults": 2,
  "numberOfChildren": 1,
  "guestName": "María González",
  "guestEmail": "maria@example.com",
  "guestPhone": "+58 414 123 4567",
  "specialRequests": "Vista al mar",
  "roomId": "ID_QUE_COPIASTE"
}
```

✅ El precio se calcula automáticamente (5 noches × 120 = 600)

---

### **5. Listar Reservas**

**Endpoint:** `GET /reservations` (requiere autenticación)

- Si eres **admin**: verás todas las reservas
- Si eres **usuario**: solo verás tus reservas

---

### **6. Confirmar Reserva**

**Endpoint:** `PATCH /reservations/{id}/confirm` (requiere autenticación)

Cambia el status de `pending` a `confirmed`.

---

## 📊 Características de Swagger en este Proyecto

### ✅ **Documentación Completa**
- Cada endpoint tiene descripción
- Ejemplos prellenados en los body
- Explicación de parámetros
- Códigos de respuesta HTTP

### ✅ **Validación en Tiempo Real**
- Los campos muestran si son requeridos u opcionales
- Tipos de datos esperados
- Valores mínimos/máximos

### ✅ **Autenticación JWT**
- Sistema de autorización integrado
- Bearer token automático en headers
- Candado visual para rutas protegidas

### ✅ **Schemas**
- Al final de la página verás todos los **Schemas** (DTOs)
- Cada uno muestra su estructura completa

---

## 🎨 Personalización

La configuración de Swagger está en [src/main.ts](src/main.ts:24-51):

```typescript
const config = new DocumentBuilder()
  .setTitle('Hotel Acquamarina API')
  .setDescription('API para el sistema de reservas')
  .setVersion('1.0')
  .addTag('Authentication', 'Endpoints de autenticación')
  // ... más configuración
  .build();
```

---

## 📝 Decoradores de Swagger

### **En Controladores:**

```typescript
@ApiTags('Reservations')           // Categoría
@ApiOperation({ summary: '...' })   // Descripción del endpoint
@ApiResponse({ status: 200, ... })  // Respuesta esperada
@ApiBearerAuth('JWT-auth')          // Requiere token
```

### **En DTOs:**

```typescript
@ApiProperty({
  description: 'Descripción del campo',
  example: 'Valor de ejemplo',
  required: true,
})
```

---

## 💡 Tips y Trucos

### **1. Export de la Documentación**

Puedes exportar la especificación OpenAPI en formato JSON:

```
http://localhost:3000/api-json
```

Útil para:
- Importar a Postman
- Generar código cliente
- Compartir con el equipo

---

### **2. Probar Queries**

Para endpoints como `GET /rooms/available?checkIn=...&checkOut=...`:

1. Click en "Try it out"
2. Ingresa los valores en los campos de parámetros
3. Swagger construye la URL automáticamente

---

### **3. Ver Respuestas de Ejemplo**

Cada endpoint muestra:
- ✅ **Example Value**: Formato del request
- ✅ **Schema**: Estructura completa del DTO
- ✅ **Responses**: Códigos HTTP posibles

---

### **4. Schemas al Final**

Desplázate al final de la página Swagger para ver la sección **Schemas**.

Aquí están todos los DTOs documentados:
- CreateReservationDto
- UpdateReservationDto
- LoginDto
- RegisterDto
- etc.

---

## 🐛 Solución de Problemas

### ❌ **Error 401 Unauthorized**

**Causa:** No estás autenticado o el token expiró.

**Solución:**
1. Hacer login nuevamente
2. Copiar el nuevo `access_token`
3. Click en **Authorize** 🔓
4. Pegar el token y autorizar

---

### ❌ **Error 400 Bad Request**

**Causa:** Datos inválidos en el request body.

**Solución:**
- Revisa que todos los campos requeridos estén presentes
- Verifica el formato (fechas, UUIDs, emails, etc.)
- Lee el mensaje de error en la respuesta

---

### ❌ **Swagger no carga**

**Causa:** El servidor no está corriendo.

**Solución:**
```bash
npm run start:dev
```

Luego abre http://localhost:3000/api

---

## 🚀 Ventajas vs Postman

| Característica | Swagger | Postman |
|----------------|---------|---------|
| Integrado en la API | ✅ | ❌ |
| Documentación automática | ✅ | Manual |
| Actualización automática | ✅ | Manual |
| No requiere instalación | ✅ | ❌ |
| Comparte con URL | ✅ | Requiere export |
| Probar endpoints | ✅ | ✅ |
| Autenticación JWT | ✅ | ✅ |

**Swagger es perfecto para desarrollo y documentación. Postman es mejor para testing avanzado y automatización.**

---

## 📚 Recursos Adicionales

- **Documentación oficial:** https://swagger.io/docs/
- **NestJS Swagger:** https://docs.nestjs.com/openapi/introduction
- **OpenAPI Spec:** https://spec.openapis.org/oas/latest.html

---

## 🎯 URL Importante

```
📚 Swagger UI:  http://localhost:3000/api
📄 OpenAPI JSON: http://localhost:3000/api-json
🏠 API Base:    http://localhost:3000
```

---

## ✨ Conclusión

Swagger es una herramienta **esencial** para:
- ✅ **Desarrolladores** - Probar endpoints fácilmente
- ✅ **Frontend** - Ver cómo consumir la API
- ✅ **Documentación** - Siempre actualizada
- ✅ **Equipo** - Compartir especificaciones

**¡Disfruta probando tu API con Swagger! 🎉**
