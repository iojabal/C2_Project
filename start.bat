@echo off
echo Iniciando C2 Backend...
start "Backend" cmd /k "cd /d %~dp0Proyecto_grado && air"

timeout /t 2 /nobreak >nul

echo Iniciando Frontend...
start "Frontend" cmd /k "cd /d %~dp0front\front && npm run dev"

echo.
echo Backend y Frontend iniciados.
echo Cierra las ventanas para detenerlos.
