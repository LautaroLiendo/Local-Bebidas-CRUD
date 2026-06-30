@echo off
setlocal
cd /d "%~dp0"

if not exist ".env" (
  echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestionlocal?schema=public > .env
  echo Se creo .env con una URL por defecto. Ajustala si tu PostgreSQL usa otro usuario, password o puerto.
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js no esta instalado. Instala la version LTS desde https://nodejs.org/ y vuelve a ejecutar este archivo.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm no esta disponible.
  exit /b 1
)

echo Instalando dependencias...
call npm install
cd server
call npm install
cd ..
cd client
call npm install
cd ..

cd /d "%~dp0"
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma

start "Backend" cmd /c "cd /d \"%~dp0server\" && npm run start:dev"
start "Frontend" cmd /c "cd /d \"%~dp0client\" && npm run dev"

timeout /t 8 /nobreak >nul
start http://localhost:3000
exit /b 0