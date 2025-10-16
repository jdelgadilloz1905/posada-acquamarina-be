@echo off
echo ========================================
echo  Hotel Acquamarina - Ver Logs
echo ========================================
echo.
echo Mostrando logs de PostgreSQL...
echo Presiona Ctrl+C para salir
echo.

docker-compose logs -f postgres
