@echo off
echo ========================================
echo  Hotel Acquamarina - Inicio Completo
echo ========================================
echo.
echo 1. Iniciando Docker (PostgreSQL)...
docker-compose up -d

echo.
echo 2. Esperando a que PostgreSQL este listo...
timeout /t 5 /nobreak > nul

echo.
echo 3. Iniciando servidor NestJS...
echo.
npm run start:dev
