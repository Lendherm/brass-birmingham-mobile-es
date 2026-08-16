# Genera un keystore local para firmar releases Android.
# NO subas release.keystore al repositorio.
param(
  [string]$KeystorePath = "android/app/release.keystore",
  [string]$Alias = "brass-mobile",
  [int]$ValidityDays = 10000
)

$keytool = Get-Command keytool -ErrorAction SilentlyContinue
if (-not $keytool) {
  Write-Error "keytool no encontrado. Instala JDK 21 y asegurate de que keytool este en PATH."
  exit 1
}

$dir = Split-Path $KeystorePath -Parent
if ($dir -and -not (Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir | Out-Null
}

Write-Host "Generando keystore en $KeystorePath (alias: $Alias)"
Write-Host "Guarda las contrasenas en un lugar seguro."

& keytool -genkeypair -v `
  -storetype PKCS12 `
  -keystore $KeystorePath `
  -alias $Alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity $ValidityDays

Write-Host ""
Write-Host "Para CI en GitHub, crea estos secrets en el repo:"
Write-Host "  ANDROID_KEYSTORE_BASE64  = base64 del archivo $KeystorePath"
Write-Host "  ANDROID_KEYSTORE_PASSWORD"
Write-Host "  ANDROID_KEY_ALIAS        = $Alias"
Write-Host "  ANDROID_KEY_PASSWORD"
Write-Host ""
Write-Host "PowerShell para generar BASE64:"
Write-Host "  [Convert]::ToBase64String([IO.File]::ReadAllBytes('$KeystorePath'))"
