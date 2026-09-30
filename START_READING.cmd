@echo off
chcp 65001 >nul
title NMR Experiment Library - Unified Reader
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
