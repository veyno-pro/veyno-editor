param([int]$Port = 8766, [switch]$NoBrowser, [switch]$Lan)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
function Get-LanIP {
  try {
    $u = New-Object System.Net.Sockets.UdpClient
    $u.Connect('8.8.8.8', 1)        # kein echter Traffic - liest nur die Quell-IP der Default-Route
    $ip = $u.Client.LocalEndPoint.Address.IPAddressToString
    $u.Close(); return $ip
  } catch {
    try { return ([System.Net.Dns]::GetHostAddresses([System.Net.Dns]::GetHostName()) | Where-Object { $_.AddressFamily -eq 'InterNetwork' -and $_.IPAddressToString -notlike '169.*' -and $_.IPAddressToString -ne '127.0.0.1' } | Select-Object -First 1).IPAddressToString } catch { return $null }
  }
}
$mime = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript'; '.mjs'='text/javascript'
  '.css'='text/css'; '.json'='application/json'; '.map'='application/json'
  '.wasm'='application/wasm'; '.onnx'='application/octet-stream'
  '.png'='image/png'; '.jpg'='image/jpeg'; '.jpeg'='image/jpeg'; '.webp'='image/webp'
  '.svg'='image/svg+xml'; '.ico'='image/x-icon'; '.webmanifest'='application/manifest+json'
  '.txt'='text/plain; charset=utf-8'
}
$bindAddr = if ($Lan) { [System.Net.IPAddress]::Any } else { [System.Net.IPAddress]::Loopback }
$listener = New-Object System.Net.Sockets.TcpListener($bindAddr, $Port)
try { $listener.Start() } catch {
  Write-Host ""
  Write-Host ("  Port {0} ist schon belegt - laeuft VEYNO bereits? Browser: http://127.0.0.1:{0}/" -f $Port)
  Start-Sleep -Seconds 6; exit 1
}
$lanIP = if ($Lan) { Get-LanIP } else { $null }
Write-Host ""
Write-Host ("  VEYNO laeuft:  http://127.0.0.1:{0}/" -f $Port)
if ($Lan -and $lanIP) {
  Write-Host ""
  Write-Host ("  AM HANDY (gleiches WLAN):  http://{0}:{1}/" -f $lanIP, $Port)
  Write-Host "  (Windows fragt evtl. einmal nach Netzwerk-Freigabe - 'Zulassen')"
}
Write-Host "  Dieses Fenster offen lassen. Schliessen beendet VEYNO."
Write-Host ""
if (-not $NoBrowser) {
  if ($Lan -and $lanIP) { Start-Process ("http://127.0.0.1:{0}/connect.html?ip={1}&port={0}" -f $Port, $lanIP) | Out-Null }
  else { Start-Process ("http://127.0.0.1:{0}/" -f $Port) | Out-Null }
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $client.ReceiveTimeout = 5000
    $stream = $client.GetStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $reqLine = $reader.ReadLine()
    while ($true) { $l = $reader.ReadLine(); if ($null -eq $l -or $l -eq '') { break } }
    if (-not $reqLine) { $client.Close(); continue }
    $parts = $reqLine.Split(' ')
    if ($parts.Count -lt 2) { $client.Close(); continue }
    $path = [Uri]::UnescapeDataString(($parts[1].Split('?')[0]))
    if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
    $file = Join-Path $root ($path.TrimStart('/') -replace '/', '\')
    $full = [IO.Path]::GetFullPath($file)
    $ok = $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path $full -PathType Leaf)
    if ($ok) {
      $bytes = [IO.File]::ReadAllBytes($full)
      $ext = [IO.Path]::GetExtension($full).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = 'application/octet-stream' }
      $head = "HTTP/1.1 200 OK`r`nContent-Type: $ct`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-store`r`nCross-Origin-Opener-Policy: same-origin`r`nCross-Origin-Embedder-Policy: require-corp`r`nContent-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://stats.veyno.art; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' https://stats.veyno.art; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`r`nX-Content-Type-Options: nosniff`r`nConnection: close`r`n`r`n"
    } else {
      $bytes = [Text.Encoding]::UTF8.GetBytes('404')
      $head = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain`r`nContent-Length: $($bytes.Length)`r`nConnection: close`r`n`r`n"
    }
    $hb = [Text.Encoding]::ASCII.GetBytes($head)
    $stream.Write($hb, 0, $hb.Length)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Flush()
  } catch { } finally { $client.Close() }
}
