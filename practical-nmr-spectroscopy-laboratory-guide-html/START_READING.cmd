@echo off
chcp 65001 >nul
title Practical NMR Spectroscopy Laboratory Guide - Local Reader
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
