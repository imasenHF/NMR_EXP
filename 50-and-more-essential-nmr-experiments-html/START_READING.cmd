@echo off
chcp 65001 >nul
title 50 and More Essential NMR Experiments - Local Reader
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
