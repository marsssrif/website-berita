@echo off
title Berita Krian - Launcher
color 0b

echo ===================================================
echo             MENJALANKAN BERITA KRIAN               
echo ===================================================
echo.
echo [1/2] Menjalankan Server Backend (Node.js)...
start "Berita Krian - Server Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo [2/2] Menjalankan ngrok (Terowongan Publik)...
start "Berita Krian - ngrok Tunnel" cmd /k "ngrok http 5175"

echo.
echo ===================================================
echo BERHASIL! Kedua terminal telah dibuka:
echo 1. Terminal Backend (Server Port 5175)
echo 2. Terminal ngrok (Salin URL Forwarding di sini)
echo.
echo Silakan salin URL https://xxxx.ngrok-free.app 
echo dari jendela ngrok untuk dibagikan saat presentasi.
echo ===================================================
echo.
pause
