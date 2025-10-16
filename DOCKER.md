# 🐳 Guía de Docker - Hotel Acquamarina Backend

## 🎯 Configuración con Docker (Recomendado para Desarrollo)

Esta configuración usa **Docker** para PostgreSQL, eliminando la necesidad de instalar PostgreSQL localmente en Windows.

---

## ✅ Requisitos Previos

- ✅ **Docker Desktop** instalado y corriendo en Windows
  - Descargar: https://www.docker.com/products/docker-desktop/
  - Verificar: `docker --version`

---

## 🚀 Inicio Rápido (3 pasos)

### **Opción 1: Usar Scripts Automatizados (Más Fácil)**

#### 1. Doble clic en: `start-dev.bat`

Este script hace todo automáticamente:
- ✅ Inicia Docker con PostgreSQL
- ✅ Espera a que la BD esté lista
- ✅ Inicia el servidor NestJS

¡Listo! El backend estará corriendo en `http://localhost:3000`

---

### **Opción 2: Paso a Paso Manual**

#### 1. Iniciar PostgreSQL con Docker

**Doble clic en:** `docker-start.bat`

O ejecuta en la terminal:
```bash
docker-compose up -d
```

Esto iniciará:
- 🐘 **PostgreSQL** en `localhost:5432`
- 🔧 **pgAdmin** (interfaz web) en `http://localhost:5050`

#### 2. Verificar que Docker está corriendo

```bash
docker-compose ps
```

Deberías ver:
```
NAME                        STATUS
hotel-acquamarina-db        Up
hotel-acquamarina-pgadmin   Up
```

#### 3. Iniciar el servidor NestJS

```bash
npm run start:dev
```

---

## 📦 Contenedores Incluidos

### 1. **PostgreSQL** (Base de Datos)

- **Puerto:** 5432
- **Usuario:** postgres
- **Contraseña:** postgres
- **Base de datos:** hotel_acquamarina
- **Versión:** PostgreSQL 15 Alpine (ligera)

**Conectar desde terminal:**
```bash
docker exec -it hotel-acquamarina-db psql -U postgres -d hotel_acquamarina
```

### 2. **pgAdmin** (Administrador Web - Opcional)

- **URL:** http://localhost:5050
- **Email:** admin@hotel.com
- **Contraseña:** admin123

**Conectar pgAdmin a PostgreSQL:**
1. Abre http://localhost:5050
2. Login con las credenciales
3. Add New Server:
   - Name: Hotel Acquamarina
   - Host: postgres (nombre del servicio Docker)
   - Port: 5432
   - Username: postgres
   - Password: postgres

---

## 🛠️ Scripts Disponibles (Windows .bat)

### `docker-start.bat` - Iniciar Docker
Inicia PostgreSQL y pgAdmin en segundo plano.

### `docker-stop.bat` - Detener Docker
Detiene todos los contenedores sin borrar datos.

### `docker-restart.bat` - Reiniciar Docker
Reinicia los contenedores manteniendo los datos.

### `docker-logs.bat` - Ver Logs
Muestra logs de PostgreSQL en tiempo real.

### `start-dev.bat` - Inicio Completo
Inicia Docker + NestJS automáticamente.

---

## 📝 Comandos Docker Útiles

### Gestión de Contenedores

```bash
# Iniciar contenedores
docker-compose up -d

# Detener contenedores (mantiene datos)
docker-compose down

# Detener y ELIMINAR datos
docker-compose down -v

# Reiniciar contenedores
docker-compose restart

# Ver estado de contenedores
docker-compose ps

# Ver logs
docker-compose logs -f

# Ver logs solo de PostgreSQL
docker-compose logs -f postgres
```

### Acceso a PostgreSQL

```bash
# Conectar a psql dentro del contenedor
docker exec -it hotel-acquamarina-db psql -U postgres -d hotel_acquamarina

# Ejecutar un comando SQL
docker exec -it hotel-acquamarina-db psql -U postgres -d hotel_acquamarina -c "SELECT * FROM users;"

# Crear backup
docker exec -it hotel-acquamarina-db pg_dump -U postgres hotel_acquamarina > backup.sql

# Restaurar backup
docker exec -i hotel-acquamarina-db psql -U postgres hotel_acquamarina < backup.sql
```

### Información y Limpieza

```bash
# Ver volúmenes
docker volume ls

# Ver uso de espacio
docker system df

# Limpiar recursos no usados
docker system prune

# Limpiar TODO (cuidado, borra datos)
docker system prune -a --volumes
```

---

## 🔄 Persistencia de Datos

Los datos de PostgreSQL se guardan en un **volumen de Docker** llamado `postgres_data`.

**Esto significa:**
- ✅ Los datos **persisten** aunque detengas los contenedores
- ✅ Puedes hacer `docker-compose down` sin perder información
- ❌ Si haces `docker-compose down -v` **SÍ se borran los datos**

### Verificar volúmenes:
```bash
docker volume ls
```

Deberías ver:
```
posada-acquamarina-be_postgres_data
posada-acquamarina-be_pgadmin_data
```

---

## 🐛 Solución de Problemas

### ❌ Error: "Port 5432 is already allocated"

**Causa:** Ya tienes PostgreSQL instalado localmente usando el puerto 5432.

**Solución 1:** Detener PostgreSQL local
```bash
# Windows (Servicios)
services.msc
# Buscar "PostgreSQL" y detenerlo
```

**Solución 2:** Cambiar puerto en docker-compose.yml
```yaml
ports:
  - "5433:5432"  # Usa 5433 en lugar de 5432
```

Y actualiza `.env`:
```env
DB_PORT=5433
```

---

### ❌ Error: "Cannot connect to Docker daemon"

**Causa:** Docker Desktop no está corriendo.

**Solución:**
1. Abre Docker Desktop
2. Espera a que inicie completamente
3. Intenta de nuevo

---

### ❌ Error: "relation 'users' does not exist"

**Causa:** Las tablas no se han creado aún.

**Solución:**
1. Asegúrate de que el servidor NestJS se inició al menos una vez
2. TypeORM crea las tablas automáticamente en desarrollo
3. Verifica con:
```bash
docker exec -it hotel-acquamarina-db psql -U postgres -d hotel_acquamarina -c "\dt"
```

---

### ❌ Contenedor se detiene inmediatamente

**Solución:** Ver logs para identificar el problema
```bash
docker-compose logs postgres
```

---

## 🔐 Configuración de Seguridad (Producción)

**⚠️ IMPORTANTE:** Esta configuración es para **desarrollo local** únicamente.

Para producción:

1. **Cambiar contraseñas:**
```yaml
environment:
  POSTGRES_PASSWORD: contraseña_super_segura_aqui
```

2. **No exponer puerto 5432:**
```yaml
# Eliminar o comentar:
# ports:
#   - "5432:5432"
```

3. **Usar variables de entorno:**
```yaml
environment:
  POSTGRES_PASSWORD: ${DB_PASSWORD}
```

4. **Considerar servicios administrados:**
   - Railway
   - Render
   - AWS RDS
   - Azure Database
   - Google Cloud SQL

---

## 📊 Monitoreo

### Ver uso de recursos:
```bash
docker stats hotel-acquamarina-db
```

### Ver espacio usado:
```bash
docker system df
```

---

## 🎨 Personalización del docker-compose.yml

### Cambiar versión de PostgreSQL:
```yaml
services:
  postgres:
    image: postgres:16-alpine  # Cambiar versión
```

### Deshabilitar pgAdmin (si no lo necesitas):
Comenta o elimina la sección `pgadmin` del archivo.

### Agregar más configuraciones:
```yaml
services:
  postgres:
    environment:
      POSTGRES_INITDB_ARGS: "--encoding=UTF8 --locale=es_ES.UTF-8"
    command: postgres -c max_connections=200
```

---

## 📚 Archivo docker-compose.yml Explicado

```yaml
version: '3.8'  # Versión de Docker Compose

services:
  postgres:
    image: postgres:15-alpine          # Imagen ligera de PostgreSQL 15
    container_name: hotel-acquamarina-db
    restart: unless-stopped            # Reinicia automáticamente
    environment:                       # Variables de entorno
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hotel_acquamarina
    ports:
      - "5432:5432"                    # Puerto host:contenedor
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persistencia
    healthcheck:                       # Verificar salud del contenedor
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:                       # Volumen para datos
    driver: local
```

---

## 🚀 Workflow Recomendado

### Día a día:

1. **Iniciar todo:**
   ```bash
   start-dev.bat
   ```

2. **Trabajar normalmente** - El servidor tiene hot-reload

3. **Al terminar:**
   ```bash
   docker-stop.bat
   ```
   (Detiene Docker pero mantiene los datos)

### Primera vez:

1. Ejecutar `docker-start.bat`
2. Ejecutar `npm run start:dev`
3. Las tablas se crearán automáticamente
4. Crear datos de prueba (ver SETUP.md)

---

## 🎯 Ventajas de Usar Docker

✅ **No necesitas instalar PostgreSQL** en tu sistema
✅ **Mismo ambiente** en todos los equipos del equipo
✅ **Fácil de borrar y recrear** sin conflictos
✅ **Versión específica** de PostgreSQL (15)
✅ **Incluye pgAdmin** para administración visual
✅ **Aislado** del resto de tu sistema
✅ **Portátil** - funciona en Windows, Mac y Linux

---

## 📖 Recursos Adicionales

- **Documentación Docker:** https://docs.docker.com/
- **PostgreSQL en Docker:** https://hub.docker.com/_/postgres
- **pgAdmin:** https://www.pgadmin.org/

---

## 💡 Tips Finales

1. **Docker Desktop debe estar corriendo** antes de ejecutar comandos
2. **Primera vez es más lenta** (descarga imágenes)
3. **Los datos persisten** entre reinicios
4. **Usa pgAdmin** si prefieres interfaz gráfica
5. **Haz backups** antes de hacer `docker-compose down -v`

---

## 🎉 ¡Listo!

Ahora tienes PostgreSQL corriendo en Docker sin instalarlo en Windows.

**Para iniciar todo de una vez:**
```bash
start-dev.bat
```

**¡Disfruta desarrollando! 🚀**
