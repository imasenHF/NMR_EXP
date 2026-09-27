@echo off
chcp 65001 >nul
title 200 and More NMR Experiments - Local Reader
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"

