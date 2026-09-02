@echo off
chcp 65001 >nul
setlocal EnableExtensions

set "TARGET1=C:\Users\jason.jiang\桌面\Tool"
set "TARGET2=C:\Users\jason.jiang\Desktop\Tool"
set "TARGET="

if exist "C:\Users\jason.jiang\桌面\" set "TARGET=%TARGET1%"
if not defined TARGET if exist "C:\Users\jason.jiang\Desktop\" set "TARGET=%TARGET2%"
if not defined TARGET set "TARGET=%TARGET1%"

echo.
echo 部署目标:
echo   %TARGET%
echo.

mkdir "%TARGET%" 2>nul
if not exist "%TARGET%\" (
  echo [错误] 无法创建目标目录。请确认用户目录存在。
  pause
  exit /b 1
)

robocopy "%~dp0." "%TARGET%" /E /XD .git __pycache__ /XF Deploy-To-Desktop.bat Deploy-To-Y.bat /NFL /NDL /NJH /NJS /nc /ns /np
if errorlevel 8 (
  echo [错误] 复制失败，errorlevel=%errorlevel%
  pause
  exit /b 1
)

echo.
echo 部署完成。
echo 请双击运行: %TARGET%\Start.bat
echo.
explorer "%TARGET%"
pause
