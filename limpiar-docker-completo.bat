@echo off
echo ========================================
echo LIMPIEZA COMPLETA DE DOCKER
echo ========================================
echo.
echo ADVERTENCIA: Esto eliminará TODOS los contenedores, imágenes y volúmenes de Docker
echo Presiona Ctrl+C para cancelar o cualquier tecla para continuar...
pause
echo.

echo [1/6] Deteniendo todos los contenedores...
docker stop $(docker ps -aq) 2>nul
echo.

echo [2/6] Eliminando todos los contenedores...
docker rm $(docker ps -aq) 2>nul
echo.

echo [3/6] Eliminando todas las imágenes...
docker rmi $(docker images -q) -f 2>nul
echo.

echo [4/6] Eliminando todos los volúmenes...
docker volume rm $(docker volume ls -q) -f 2>nul
echo.

echo [5/6] Eliminando todas las redes personalizadas...
docker network rm $(docker network ls -q) 2>nul
echo.

echo [6/6] Limpieza completa del sistema Docker...
docker system prune -a -f --volumes
echo.

echo ========================================
echo LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Docker ha sido completamente limpiado.
echo Ahora puedes iniciar MongoDB nuevamente.
echo.
pause