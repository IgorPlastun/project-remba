$ErrorActionPreference = "Stop"

$port = 4173
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

$ips = ipconfig |
  Select-String -Pattern "IPv4" |
  ForEach-Object {
    if ($_.Line -match "(\d{1,3}(?:\.\d{1,3}){3})") {
      $matches[1]
    }
  } |
  Where-Object {
    $_ -notlike "127.*" -and
    $_ -notlike "169.254.*"
  }

Write-Host "Starting site on local network..."
Write-Host "Project folder: $root"
Write-Host ""

foreach ($ip in $ips) {
  Write-Host "Open from another device: http://$ip`:$port/index.html"
}

Write-Host ""
Write-Host "Press Ctrl+C to stop."
Set-Location $root
$env:HOST = "0.0.0.0"
$env:PORT = "$port"
node .scratch\static-server.mjs
