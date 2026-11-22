@echo off
title VEYNO  -  dieses Fenster offen lassen
cd /d "%~dp0"

if not exist "%~dp0index.html" goto :nozip
if not exist "%~dp0veyno-server.ps1" goto :nozip

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){ try{ $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',8766); $c.Close(); Start-Process 'http://127.0.0.1:8766/'; break }catch{ Start-Sleep -Milliseconds 250 } }"

where node >/dev/null 2>/dev/null
if %errorlevel%==0 (
  node veyno-server.js
  if errorlevel 1 goto :psfallback
  goto :eof
)
if exist "%ProgramFiles%\nodejs\node.exe" (
  "%ProgramFiles%\nodejs\node.exe" veyno-server.js
  if errorlevel 1 goto :psfallback
  goto :eof
)

:psfallback
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0veyno-server.ps1" -NoBrowser
pause
goto :eof

:nozip
echo.
echo   ============================================================
echo    Bitte die ZIP-Datei zuerst KOMPLETT entpacken:
echo    Rechtsklick auf die ZIP ^> "Alle extrahieren..."
echo    Danach im entpackten Ordner "VEYNO starten.cmd" doppelklicken.
echo   ============================================================
echo.
pause
