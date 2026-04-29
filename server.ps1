$http = [System.Net.HttpListener]::new()
$http.Prefixes.Add("http://localhost:8000/")
$http.Start()

function Get-ContentType($path) {
    $extension = [System.IO.Path]::GetExtension($path).ToLowerInvariant()
    switch ($extension) {
        ".html" { return "text/html; charset=utf-8" }
        ".css" { return "text/css; charset=utf-8" }
        ".js" { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        ".txt" { return "text/plain; charset=utf-8" }
        ".svg" { return "image/svg+xml; charset=utf-8" }
        ".png" { return "image/png" }
        ".jpg" { return "image/jpeg" }
        ".jpeg" { return "image/jpeg" }
        ".gif" { return "image/gif" }
        ".webp" { return "image/webp" }
        ".ico" { return "image/x-icon" }
        ".manifest" { return "application/manifest+json; charset=utf-8" }
        default { return "application/octet-stream" }
    }
}

Write-Host "Сервер запущен на http://localhost:8000"
Write-Host "Артикотус готов к работе!"

Start-Process "http://localhost:8000"

while ($http.IsListening) {
    $context = $http.GetContext()
    $request = $context.Request
    $response = $context.Response
    
    $localPath = $request.Url.LocalPath
    if ($localPath -eq "/") { $localPath = "/index.html" }
    
    $filePath = Join-Path $PSScriptRoot $localPath.Substring(1)
    
    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentType = Get-ContentType $filePath
        
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $response.ContentType = "text/plain; charset=utf-8"
        $errorContent = [System.Text.Encoding]::UTF8.GetBytes("Файл не найден")
        $response.ContentLength64 = $errorContent.Length
        $response.OutputStream.Write($errorContent, 0, $errorContent.Length)
    }
    
    $response.Close()
}

$http.Stop()
