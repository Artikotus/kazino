@echo off
setlocal EnableExtensions

REM ------------------------------------------------------------
REM Artikotus deploy to Timeweb hosting via Paramiko uploader
REM Usage:
REM   deploy_hosting.cmd
REM   deploy_hosting.cmd <HOST> <USER> <REMOTE_WEB_ROOT>
REM Or create server_access.local.env and run without arguments.
REM Example local env keys:
REM   HOSTING_HOST=
REM   HOSTING_USER=
REM   HOSTING_PASS=
REM   HOSTING_WEB_ROOT=
REM ------------------------------------------------------------

if exist "%~dp0server_access.local.env" (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /r "^[A-Za-z_][A-Za-z0-9_]*=" "%~dp0server_access.local.env"`) do set "%%A=%%B"
)

set "HOST=%~1"
if "%HOST%"=="" set "HOST=%HOSTING_HOST%"
if "%HOST%"=="" set /p HOST=Введите HOSTING_HOST: 

set "USER=%~2"
if "%USER%"=="" set "USER=%HOSTING_USER%"
if "%USER%"=="" set /p USER=Введите HOSTING_USER: 

set "REMOTE_WEB_ROOT=%~3"
if "%REMOTE_WEB_ROOT%"=="" set "REMOTE_WEB_ROOT=%HOSTING_WEB_ROOT%"
if "%REMOTE_WEB_ROOT%"=="" set "REMOTE_WEB_ROOT=/home/c/%USER%/api/public_html"

set "REMOTE_RUNTIME_ROOT=%HOSTING_RUNTIME_ROOT%"
if "%REMOTE_RUNTIME_ROOT%"=="" set "REMOTE_RUNTIME_ROOT=/home/c/%USER%/api/artikotus_runtime"

if not exist "%~dp0remote_upload.py" (
  echo [ERROR] Не найден remote_upload.py рядом со скриптом.
  exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Python не найден в PATH.
  exit /b 1
)

if "%HOSTING_PASS%"=="" set /p HOSTING_PASS=Введите HOSTING_PASS для %USER%@%HOST%: 

echo.
echo [INFO] Deploy target:
echo        host   = %HOST%
echo        user   = %USER%
echo        web    = %REMOTE_WEB_ROOT%
echo        runtime= %REMOTE_RUNTIME_ROOT%
echo.

set "ROOT=%~dp0"

set "UPLOAD_CMD=python "%ROOT%remote_upload.py" --host "%HOST%" --user "%USER%" --password "%HOSTING_PASS%""

call :upload_file "%ROOT%index.html" "%REMOTE_WEB_ROOT%/index.html" || exit /b 1
call :upload_file "%ROOT%manifest.json" "%REMOTE_WEB_ROOT%/manifest.json" || exit /b 1
call :upload_dir  "%ROOT%bd" "%REMOTE_WEB_ROOT%/bd" || exit /b 1
call :upload_dir  "%ROOT%game" "%REMOTE_WEB_ROOT%/game" || exit /b 1

call :upload_file "%ROOT%websocket_server.py" "%REMOTE_RUNTIME_ROOT%/websocket_server.py" || exit /b 1
call :upload_file "%ROOT%requirements.txt" "%REMOTE_RUNTIME_ROOT%/requirements.txt" || exit /b 1
call :upload_file "%ROOT%rules.kotobot.txt" "%REMOTE_RUNTIME_ROOT%/rules.kotobot.txt" || exit /b 1

echo.
echo [OK] Заливка завершена успешно.
exit /b 0

:upload_file
set "LOCAL_FILE=%~1"
set "REMOTE_FILE=%~2"
if not exist "%LOCAL_FILE%" (
  echo [ERROR] Локальный файл не найден: %LOCAL_FILE%
  exit /b 1
)
echo [UPLOAD FILE] %LOCAL_FILE% ^> %REMOTE_FILE%
%UPLOAD_CMD% --local "%LOCAL_FILE%" --remote "%REMOTE_FILE%"
if errorlevel 1 (
  echo [ERROR] Ошибка загрузки файла: %LOCAL_FILE%
  exit /b 1
)
exit /b 0

:upload_dir
set "LOCAL_DIR=%~1"
set "REMOTE_DIR=%~2"
if not exist "%LOCAL_DIR%" (
  echo [ERROR] Локальная папка не найдена: %LOCAL_DIR%
  exit /b 1
)
echo [UPLOAD DIR ] %LOCAL_DIR% ^> %REMOTE_DIR%
%UPLOAD_CMD% --local "%LOCAL_DIR%" --remote "%REMOTE_DIR%"
if errorlevel 1 (
  echo [ERROR] Ошибка загрузки папки: %LOCAL_DIR%
  exit /b 1
)
exit /b 0