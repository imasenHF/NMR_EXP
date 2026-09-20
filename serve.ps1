param(
    [int]$Port = 8765,
    [switch]$NoBrowser
)

$siteRoot = [IO.Path]::GetFullPath((Split-Path -Parent $MyInvocation.MyCommand.Path))
$rootPrefix = $siteRoot.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.gif'  = 'image/gif'
    '.ico'  = 'image/x-icon'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
$url = "http://127.0.0.1:$Port/index.html"
Write-Host "Local reader: $url"
Write-Host "Keep this window open while reading. Press Ctrl+C to stop."
if (-not $NoBrowser) { Start-Process $url }

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $stream = $client.GetStream()
            $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 4096, $true)
            $requestLine = $reader.ReadLine()
            if (-not $requestLine) { continue }
            while ($reader.ReadLine()) { }

            $parts = $requestLine.Split(' ')
            $method = $parts[0]
            $requestPath = if ($parts.Count -gt 1) { $parts[1].Split('?')[0] } else { '/' }
            $relativePath = [Uri]::UnescapeDataString($requestPath).TrimStart('/').Replace('/', [IO.Path]::DirectorySeparatorChar)
            if (-not $relativePath) { $relativePath = 'index.html' }
            $target = [IO.Path]::GetFullPath((Join-Path $siteRoot $relativePath))

            $status = '200 OK'
            $body = [byte[]]@()
            $contentType = 'application/octet-stream'
            if (-not $target.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
                $status = '403 Forbidden'
                $body = [Text.Encoding]::UTF8.GetBytes('Forbidden')
                $contentType = 'text/plain; charset=utf-8'
            } else {
                if (Test-Path -LiteralPath $target -PathType Container) { $target = Join-Path $target 'index.html' }
                if (Test-Path -LiteralPath $target -PathType Leaf) {
                    $body = [IO.File]::ReadAllBytes($target)
                    $extension = [IO.Path]::GetExtension($target).ToLowerInvariant()
                    if ($mimeTypes.ContainsKey($extension)) { $contentType = $mimeTypes[$extension] }
                } else {
                    $status = '404 Not Found'
                    $body = [Text.Encoding]::UTF8.GetBytes('Not Found')
                    $contentType = 'text/plain; charset=utf-8'
                }
            }

            $header = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
            $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
            $stream.Write($headerBytes, 0, $headerBytes.Length)
            if ($method -ne 'HEAD') { $stream.Write($body, 0, $body.Length) }
            $stream.Flush()
        } catch {
            Write-Warning $_.Exception.Message
        } finally {
            $client.Dispose()
        }
    }
} finally {
    $listener.Stop()
}
