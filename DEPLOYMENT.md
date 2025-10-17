# 🚀 Deployment Guide - Posada Acquamarina Backend

## Render.com Deployment

### Variables de Entorno en Render

Configura estas variables en tu Web Service de Render:

```
DB_HOST=dpg-d3ot25s9c44c738ftrrg-a.oregon-postgres.render.com
DB_PORT=5432
DB_USERNAME=omendj
DB_PASSWORD=HWDBGMcHTKcE7vcFeD4xAP2twwrjWHGO
DB_DATABASE=hotel_acquamarina
JWT_SECRET=tu_clave_secreta_super_segura_cambiala_en_produccion
JWT_EXPIRATION=7d
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://tu-frontend-url.vercel.app
```

### Build Command
```bash
bash render-build.sh
```

### Start Command
```bash
npm run start:prod
```

### Región
Oregon (US West) - Misma región que la base de datos

---

## ⚠️ IMPORTANTE - Después del primer deploy

Una vez que la aplicación esté funcionando y las tablas creadas:

1. Ve a `src/app.module.ts`
2. Cambia `synchronize: true` a `synchronize: false`
3. Haz commit y push para que se despliegue de nuevo
4. Esto evitará que TypeORM modifique la estructura de la BD en producción

---

## 📚 Documentación API

Una vez desplegado, accede a:
- API Docs (Swagger): `https://tu-app.onrender.com/api`
