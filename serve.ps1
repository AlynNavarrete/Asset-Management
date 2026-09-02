param([int]$Port = 8000)

$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$server = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::IPv6Any, $Port)
$server.Server.DualMode = $true
$server.Start()
Write-Host "Asset Management disponible en http://localhost:$Port/"

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
    '.js' = 'application/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8'
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
    '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'
}

try {
    while ($true) {
        $client = $server.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            while ($reader.ReadLine()) { }

            $requestTarget = if ($requestLine -match '^GET\s+([^\s]+)') { $Matches[1] } else { '/' }
            $relativePath = [Uri]::UnescapeDataString(($requestTarget -split '\?')[0].TrimStart('/'))
            if ([string]::IsNullOrWhiteSpace($relativePath)) { $relativePath = 'Login/code.html' }

            $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $relativePath))
            if ($filePath.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase) -and [System.IO.File]::Exists($filePath)) {
                $body = [System.IO.File]::ReadAllBytes($filePath)
                $extension = [System.IO.Path]::GetExtension($filePath).ToLowerInvariant()
                $contentType = if ($mimeTypes.ContainsKey($extension)) { $mimeTypes[$extension] } else { 'application/octet-stream' }
                $status = '200 OK'
            } else {
                $body = [System.Text.Encoding]::UTF8.GetBytes('404 - Archivo no encontrado')
                $contentType = 'text/plain; charset=utf-8'
                $status = '404 Not Found'
            }

            $headers = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headers)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            $stream.Write($body, 0, $body.Length)
        }
        catch {
            # Los navegadores pueden cancelar solicitudes auxiliares. Una
            # desconexión individual no debe detener el servidor completo.
            Write-Warning "Solicitud interrumpida: $($_.Exception.Message)"
        }
        finally {
            $client.Close()
        }
    }
}
finally {
    $server.Stop()
}
