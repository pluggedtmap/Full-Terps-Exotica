@echo off
set PORT=3002
title Serveur Big Clouds
echo ---------------------------------------------------
echo DÉMARRAGE DU SERVEUR...
echo ---------------------------------------------------

cd /d "%~dp0"

if not exist node_modules (
    echo Installation des modules...
    call npm install
)

echo.
echo Lancement de node server.js...
echo.
echo Site Web      : http://localhost:3002
echo Admin Panel   : http://localhost:3002/admin.html
echo.
echo Ouverture automatique de l'admin dans 2 secondes...
timeout /t 2 >nul
start http://localhost:3    002/admin.html
echo.
echo Si cette fenetre se ferme tout de suite, il y a une erreur.
echo.

node server.js

echo.
echo ---------------------------------------------------
echo LE SERVEUR S'EST ARRETÉ.
echo ---------------------------------------------------
pause
