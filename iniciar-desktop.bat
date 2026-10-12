@echo off
title GhostGram Desktop Launcher
cd /d "%~dp0"

echo ========================================================
echo        Iniciando GhostGram Desktop...
echo ========================================================

if exist "packages\desktop\dist\win-unpacked\GhostGram.exe" (
  start "" "packages\desktop\dist\win-unpacked\GhostGram.exe"
) else (
  pnpm run start:desktop
)

exit
