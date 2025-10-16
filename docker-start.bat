@echo off
echo ========================================
echo  Hotel Acquamarina - Iniciar Docker
echo ========================================
echo.
echo Iniciando PostgreSQL con Docker...
echo.

docker-compose up -d

echo.
echo ========================================
echo  Docker iniciado correctamente!
echo ========================================
echo.
echo PostgreSQL: http://localhost:5432
echo   Usuario: postgres
echo   Password: postgres
echo   Base de datos: hotel_acquamarina
echo.
echo pgAdmin: http://localhost:5050
echo   Email: admin@hotel.com
echo   Password: admin123
echo.
echo Para ver logs: docker-compose logs -f
echo Para detener: docker-compose down
echo ========================================
