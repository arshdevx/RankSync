@echo off
title Launching RankSync...
cd /d "%~dp0"
if exist "RankSync-Windows\RankSync.exe" (
  start "" "RankSync-Windows\RankSync.exe"
) else (
  start "" npx electron .
)
exit
