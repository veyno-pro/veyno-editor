@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js fehlt. Bitte von https://nodejs.org installieren ^(LTS^) und neu starten. & pause & exit /b 1)
if not exist node_modules\electron-builder (
  echo [1/2] Pakete installieren ^(einmalig, laedt einige hundert MB^) ...
  call npm install || (echo npm install fehlgeschlagen. & pause & exit /b 1)
)
echo [2/2] Installer bauen ...
node bauen-windows.js %* || (echo Bau fehlgeschlagen - Meldungen oben. & pause & exit /b 1)
echo.
echo FERTIG! Die Setup-Dateien liegen im Ordner dist\
start "" "%~dp0dist"
pause
