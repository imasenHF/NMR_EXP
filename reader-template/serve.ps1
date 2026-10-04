param([int]$Port = 8765)
$root = (Resolve-Path (Join-Path $PSScriptRoot '.')).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
try {
  $listener.Start()
  Write-Host "Reader template: http://127.0.0.1:$Port/"
  Write-Host "Press Ctrl+C to stop."
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart('/'))
      if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
      $candidate = [IO.Path]::GetFullPath((Join-Path $root $relative))
      if (-not $candidate.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $candidate -PathType Leaf)) {
        $context.Response.StatusCode = 404
        $context.Response.Close()
        continue
      }
      $bytes = [IO.File]::ReadAllBytes($candidate)
      $context.Response.ContentType = switch ([IO.Path]::GetExtension($candidate).ToLowerInvariant()) {
        '.html' { 'text/html; charset=utf-8' }
        '.css' { 'text/css; charset=utf-8' }
        '.js' { 'text/javascript; charset=utf-8' }
        '.svg' { 'image/svg+xml' }
        '.json' { 'application/json; charset=utf-8' }
        default { 'application/octet-stream' }
      }
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      $context.Response.Close()
    } catch {
      try { $context.Response.StatusCode = 500; $context.Response.Close() } catch {}
    }
  }
} finally {
  if ($listener.IsListening) { $listener.Stop() }
  $listener.Close()
}
