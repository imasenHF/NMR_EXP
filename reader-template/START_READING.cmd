@echo off
chcp 65001 >nul
title Single-Language HTML Reader Template
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
