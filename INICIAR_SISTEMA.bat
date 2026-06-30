@echo off
cd /d "%~dp0"
:: Inicia Backend
start /b cmd /c "cd server && npm run start:prod"
:: Inicia Frontend
start /b cmd /c "cd client && npm run start"
:: Abre el navegador después de 8 segundos para dar tiempo a que carguen
timeout /t 8 /nobreak >nul
start http://localhost:3000
exit