@echo off
chcp 65001 >nul
set "TARGET=Y:\03_Exchange\03_Among Supply Chain\05_物流单证\Tool\周数据库"
echo.
echo 将部署到:
echo   %TARGET%
echo.
if not exist "Y:\03_Exchange\03_Among Supply Chain\05_物流单证\Tool" (
  echo [错误] 找不到目标目录。请确认本机已映射 Y: 盘且路径存在。
  pause
  exit /b 1
)
mkdir "%TARGET%" 2>nul
robocopy "%~dp0." "%TARGET%" /E /XD data .git __pycache__ /XF Deploy-To-Y.bat /NFL /NDL /NJH /NJS /nc /ns /np
if errorlevel 8 (
  echo [错误] 复制失败，errorlevel=%errorlevel%
  pause
  exit /b 1
)
echo.
echo 部署完成。可双击运行:
echo   %TARGET%\Start.bat
echo.
explorer "%TARGET%"
pause
