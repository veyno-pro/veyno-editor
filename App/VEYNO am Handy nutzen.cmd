@echo off
title VEYNO  -  Handy-Zugriff  -  Fenster offen lassen
cd /d "%~dp0"
if not exist "%~dp0index.html" goto :nozip
if not exist "%~dp0veyno-server.ps1" goto :nozip

set "LANIP="
for /f "delims=" %%i in ('powershell -NoProfile -Command "try{$u=New-Object Net.Sockets.UdpClient;$u.Connect('8.8.8.8',1);$u.Client.LocalEndPoint.Address.IPAddressToString}catch{''}"') do set "LANIP=%%i"

start "" /b powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){ try{ $c=New-Object Net.Sockets.TcpClient; $c.Connect('127.0.0.1',8766); $c.Close(); Start-Process ('http://127.0.0.1:8766/connect.html?ip=%LANIP%&port=8766'); break }catch{ Start-Sleep -Milliseconds 250 } }"

echo.
echo   VEYNO wird im Heimnetz freigegeben.
if defined LANIP echo   Am Handy ^(gleiches WLAN^):  http://%LANIP%:8766/
echo   Windows fragt evtl. einmal nach Netzwerk-Freigabe - bitte "Zulassen".
echo   Dieses Fenster offen lassen.
echo.

where node >/dev/null 2>/dev/null
if %errorlevel%==0 ( set HOST=0.0.0.0& node veyno-server.js & goto :eof )
if exist "%ProgramFiles%\nodejs\node.exe" ( set HOST=0.0.0.0& "%ProgramFiles%\nodejs\node.exe" veyno-server.js & goto :eof )
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0veyno-server.ps1" -Lan -NoBrowser
pause
goto :eof

:nozip
echo.
echo   Bitte die ZIP-Datei zuerst KOMPLETT entpacken
echo   ^(Rechtsklick ^> "Alle extrahieren..."^), dann erneut starten.
echo.
pause
