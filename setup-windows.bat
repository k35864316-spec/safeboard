@echo off
rem SafeBoard setup helper - double-click this file (it must stay next to package.json)
cd /d "%~dp0"
echo ==============================================
echo  SafeBoard setup
echo ==============================================
echo Running in folder: %cd%
echo.
if not exist package.json (
  echo [ERROR] package.json was not found in this folder.
  echo Move this file into the folder that contains package.json and src, then run it again.
  echo.
  echo Files found here:
  dir /b
  pause
  exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found.
  echo Install Node.js LTS from https://nodejs.org and then run this file again.
  pause
  exit /b 1
)
echo Node version:
node -v
echo npm version:
call npm -v
echo.
echo Installing packages. This can take a few minutes...
call npm install
if errorlevel 1 (
  echo.
  echo [ERROR] npm install failed. Copy all the messages above and send them to me.
  pause
  exit /b 1
)
echo.
echo ==============================================
echo  Install finished.
echo  Next steps, one at a time in the VS Code terminal:
echo    1. npm run db:up     (start MongoDB with Docker)
echo    2. npm run seed      (create sample accounts and posts)
echo    3. npm run dev       (open http://localhost:3000)
echo ==============================================
pause
