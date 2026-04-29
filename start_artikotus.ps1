$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

function Stop-PortListeners {
    param(
        [int[]]$Ports
    )

    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
        Where-Object { $_.LocalPort -in $Ports } |
        Select-Object -ExpandProperty OwningProcess -Unique

    foreach ($processId in $connections) {
        if ($processId -and $processId -ne $PID) {
            try {
                Stop-Process -Id $processId -Force -ErrorAction Stop
                Write-Host "Остановлен процесс PID $processId"
            } catch {
                Write-Warning "Не удалось остановить PID ${processId}: $($_.Exception.Message)"
            }
        }
    }
}

function Get-PythonExecutable {
    $python = Get-Command python -ErrorAction SilentlyContinue
    if ($python) {
        return $python.Source
    }

    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) {
        return $py.Source
    }

    throw "Python не найден в PATH."
}

function Start-ArtikotusProcess {
    param(
        [string]$PythonExe,
        [string]$Arguments,
        [string]$Name
    )

    $process = Start-Process -FilePath $PythonExe `
        -ArgumentList $Arguments `
        -WorkingDirectory $PSScriptRoot `
        -PassThru

    Start-Sleep -Milliseconds 1200

    if ($process.HasExited) {
        throw "$Name не запустился. Код выхода: $($process.ExitCode)"
    }

    Write-Host "$Name запущен. PID: $($process.Id)"
}

$ports = @(8000, 8765)
Write-Host "Перезапуск Artikotus..."
Stop-PortListeners -Ports $ports

$pythonExe = Get-PythonExecutable
Write-Host "Используется Python: $pythonExe"

Start-ArtikotusProcess -PythonExe $pythonExe -Arguments "server.py" -Name "HTTP сервер"
Start-ArtikotusProcess -PythonExe $pythonExe -Arguments "-u websocket_server.py" -Name "WebSocket сервер"

Start-Process "http://127.0.0.1:8000/"
Write-Host "Artikotus доступен на http://127.0.0.1:8000/"
